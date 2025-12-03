/**
 * Universal API Provider Route
 * Routes requests to appropriate backend based on provider
 *
 * Supported providers:
 * - deepmicropath: DeepMicroPath backend API
 */

import { getServerSideConfig } from "@/app/config/server";
import { DEEPMICROPATH_BASE_URL, ModelProvider } from "@/app/constant";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth";

const serverConfig = getServerSideConfig();

// Default timeout: 30 minutes for long-running analysis
const REQUEST_TIMEOUT = 30 * 60 * 1000;

async function handle(
  req: NextRequest,
  { params }: { params: { provider: string; path: string[] } },
) {
  const provider = params.provider;
  const pathSegments = params.path || [];

  console.log(`[${provider} Route] path:`, pathSegments);

  // Handle OPTIONS for CORS
  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  // Route based on provider
  if (provider === "deepmicropath") {
    return handleDeepMicroPath(req, pathSegments);
  }

  // Unsupported provider
  return NextResponse.json(
    { error: true, message: `Provider '${provider}' not supported` },
    { status: 400 },
  );
}

async function handleDeepMicroPath(req: NextRequest, pathSegments: string[]) {
  // Auth check
  const authResult = auth(req, ModelProvider.DeepMicroPath);
  if (authResult.error) {
    return NextResponse.json(authResult, { status: 401 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error("[DeepMicroPath] Request timeout");
    controller.abort();
  }, REQUEST_TIMEOUT);

  try {
    // Build backend URL
    let baseUrl = serverConfig.deepmicropathUrl || DEEPMICROPATH_BASE_URL;

    if (!baseUrl.startsWith("http")) {
      baseUrl = `http://${baseUrl}`;
    }

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    // Join path segments
    const path = pathSegments.join("/");

    // Determine backend path prefix
    let backendPath: string;

    if (path.startsWith("chat/completions") || path === "models") {
      // OpenAI-compatible endpoints go to /v1/*
      backendPath = `/v1/${path}`;
    } else {
      // All other endpoints go to /api/v1/*
      backendPath = `/api/v1/${path}`;
    }

    const fetchUrl = `${baseUrl}${backendPath}`;
    console.log("[DeepMicroPath] Proxying to:", fetchUrl);

    // Prepare request body
    let bodyContent: BodyInit | undefined;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      bodyContent = await req.blob();
    } else if (contentType.includes("application/json")) {
      bodyContent = await req.text();
    } else if (req.body) {
      bodyContent = req.body;
    }

    // Build headers
    const headers: HeadersInit = {
      Authorization: req.headers.get("Authorization") || "",
    };

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

    console.log("[DeepMicroPath] Response status:", response.status);

    // Check if streaming response
    const responseContentType = response.headers.get("content-type") || "";
    const isStreaming = responseContentType.includes("text/event-stream");

    if (isStreaming) {
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

    // Non-streaming response
    const newHeaders = new Headers(response.headers);
    newHeaders.delete("www-authenticate");
    newHeaders.set("X-Accel-Buffering", "no");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error: any) {
    console.error("[DeepMicroPath] Error:", error.message);

    let errorMessage = error.message;
    let statusCode = 500;

    if (error.name === "AbortError") {
      errorMessage = "Request timeout";
      statusCode = 504;
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "Backend service unavailable";
      statusCode = 503;
    }

    return NextResponse.json(
      { error: true, message: errorMessage },
      { status: statusCode },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const OPTIONS = handle;

// Use nodejs runtime for better streaming support
export const runtime = "nodejs";
