/**
 * DeepMicroPath API Proxy Route
 * Proxies requests from frontend to DeepMicroPath backend
 *
 * Endpoints:
 * - /api/deepmicropath/files/* -> Backend /api/v1/files/*
 * - /api/deepmicropath/inference/* -> Backend /api/v1/inference/*
 * - /api/deepmicropath/agent/* -> Backend /api/v1/agent/*
 * - /api/deepmicropath/chat/completions -> Backend /v1/chat/completions (OpenAI-compatible)
 * - /api/deepmicropath/health -> Backend /api/v1/health
 */

import { getServerSideConfig } from "@/app/config/server";
import { DEEPMICROPATH_BASE_URL, ModelProvider } from "@/app/constant";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth";

const serverConfig = getServerSideConfig();

// Default timeout: 30 minutes for long-running analysis
const REQUEST_TIMEOUT = 30 * 60 * 1000;

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handle(req, { params });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handle(req, { params });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handle(req, { params });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return handle(req, { params });
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({ body: "OK" }, { status: 200 });
}

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  console.log("[DeepMicroPath Proxy] Request path:", params.path);

  // Auth check (if enabled)
  const authResult = auth(req, ModelProvider.DeepMicroPath);
  if (authResult.error) {
    return NextResponse.json(authResult, { status: 401 });
  }

  try {
    return await proxyRequest(req, params.path);
  } catch (e) {
    console.error("[DeepMicroPath Proxy] Error:", e);
    return NextResponse.json(
      {
        error: true,
        message: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error("[DeepMicroPath Proxy] Request timeout");
    controller.abort();
  }, REQUEST_TIMEOUT);

  try {
    // Build backend URL
    let baseUrl = serverConfig.deepmicropathUrl || DEEPMICROPATH_BASE_URL;

    // Ensure baseUrl has protocol
    if (!baseUrl.startsWith("http")) {
      baseUrl = `http://${baseUrl}`;
    }

    // Remove trailing slash
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    // Join path segments
    const path = pathSegments.join("/");

    // Determine backend path prefix based on endpoint type
    let backendPath: string;

    if (path.startsWith("chat/completions") || path === "models") {
      // OpenAI-compatible endpoints go to /v1/*
      backendPath = `/v1/${path}`;
    } else {
      // All other endpoints go to /api/v1/*
      backendPath = `/api/v1/${path}`;
    }

    const fetchUrl = `${baseUrl}${backendPath}`;
    console.log("[DeepMicroPath Proxy] Forwarding to:", fetchUrl);

    // Prepare request body
    let bodyContent: BodyInit | undefined;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // For file uploads, pass through the FormData
      bodyContent = await req.blob();
    } else if (contentType.includes("application/json")) {
      // For JSON requests
      bodyContent = await req.text();
    } else if (req.body) {
      bodyContent = req.body;
    }

    // Build headers
    const headers: HeadersInit = {
      Authorization: req.headers.get("Authorization") || "",
    };

    // Only set Content-Type for non-multipart requests
    if (!contentType.includes("multipart/form-data")) {
      headers["Content-Type"] = contentType || "application/json";
    }

    // Make the request
    const response = await fetch(fetchUrl, {
      method: req.method,
      headers,
      body: bodyContent,
      signal: controller.signal,
      // @ts-ignore - duplex is needed for streaming
      duplex: "half",
    });

    console.log("[DeepMicroPath Proxy] Response status:", response.status);

    // Check if this is a streaming response
    const responseContentType = response.headers.get("content-type") || "";
    const isStreaming = responseContentType.includes("text/event-stream");

    if (isStreaming) {
      // For SSE, pass through the stream
      const newHeaders = new Headers(response.headers);
      newHeaders.set("X-Accel-Buffering", "no");
      newHeaders.set("Cache-Control", "no-cache");
      newHeaders.set("Connection", "keep-alive");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    // For non-streaming, return as-is
    const responseBody = await response.text();

    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type": responseContentType || "application/json",
      },
    });
  } catch (error: any) {
    console.error("[DeepMicroPath Proxy] Fetch error:", {
      message: error.message,
      code: error.code,
      name: error.name,
    });

    let errorMessage = error.message;
    let statusCode = 500;

    if (error.name === "AbortError") {
      errorMessage = "Request timeout (30 minutes exceeded)";
      statusCode = 504;
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "Backend service unavailable";
      statusCode = 503;
    } else if (error.code === "ECONNRESET") {
      errorMessage = "Connection reset by backend";
      statusCode = 502;
    }

    return NextResponse.json(
      {
        error: true,
        message: errorMessage,
        details: error.code,
      },
      { status: statusCode },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
