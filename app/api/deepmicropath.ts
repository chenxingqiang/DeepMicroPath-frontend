import { getServerSideConfig } from "@/app/config/server";
import {
  DEEPMICROPATH_BASE_URL,
  ApiPath,
  ModelProvider,
  ServiceProvider,
} from "@/app/constant";
import { prettyObject } from "@/app/utils/format";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth";
import { isModelNotavailableInServer } from "@/app/utils/model";

const serverConfig = getServerSideConfig();

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  console.log("[DeepMicroPath Route] params ", params);

  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  const authResult = auth(req, ModelProvider.DeepMicroPath);
  if (authResult.error) {
    return NextResponse.json(authResult, {
      status: 401,
    });
  }

  try {
    const response = await request(req);
    return response;
  } catch (e) {
    console.error("[DeepMicroPath] ", e);
    return NextResponse.json(prettyObject(e));
  }
}

async function request(req: NextRequest) {
  const controller = new AbortController();

  // Get path after removing the API prefix
  let path = `${req.nextUrl.pathname}`.replaceAll(ApiPath.DeepMicroPath, "");

  let baseUrl = serverConfig.deepmicropathUrl || DEEPMICROPATH_BASE_URL;

  // Special handling: /chat/completions goes directly to SGLang (port 6001)
  // instead of Agent API (port 8000)
  if (path.includes("/chat/completions")) {
    console.log("[DeepMicroPath] Routing to SGLang directly");
    baseUrl = "http://172.20.1.38:6001";
    path = "/v1/chat/completions";
  } else {
    // Add /api/v1/ prefix for backend API calls
    path = `/api/v1${path}`;
  }

  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }

  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  console.log("[DeepMicroPath Proxy] Path:", path);
  console.log("[DeepMicroPath Proxy] Base URL:", baseUrl);
  console.log("[DeepMicroPath Proxy] Full URL:", fetchUrl);

  // Agent API 可能需要更长时间（特别是工具调用和多轮推理）
  // Increase timeout to 30 minutes for complex reasoning
  const timeoutId = setTimeout(
    () => {
      console.error("[DeepMicroPath Proxy] Request timeout after 30 minutes");
      controller.abort();
    },
    30 * 60 * 1000, // 30 minutes timeout
  );

  const fetchUrl = `${baseUrl}${path}`;

  // Read body first if needed for filtering
  let bodyContent = req.body;
  if (serverConfig.customModels && req.body) {
    try {
      const clonedBody = await req.text();
      bodyContent = clonedBody;

      const jsonBody = JSON.parse(clonedBody) as { model?: string };

      // Check if model is allowed
      if (
        isModelNotavailableInServer(
          serverConfig.customModels,
          jsonBody?.model as string,
          ServiceProvider.DeepMicroPath as string,
        )
      ) {
        return NextResponse.json(
          {
            error: true,
            message: `you are not allowed to use ${jsonBody?.model} model`,
          },
          {
            status: 403,
          },
        );
      }
    } catch (e) {
      console.error(`[DeepMicroPath] filter`, e);
    }
  }

  const fetchOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      Authorization: req.headers.get("Authorization") ?? "",
    },
    method: req.method,
    body: bodyContent,
    redirect: "manual",
    // @ts-ignore
    duplex: "half",
    signal: controller.signal,
  };

  console.log(
    "[DeepMicroPath Proxy] Request body:",
    typeof bodyContent === "string" ? bodyContent.substring(0, 200) : "stream",
  );

  try {
    console.log("[DeepMicroPath Proxy] Sending request...");
    const res = await fetch(fetchUrl, fetchOptions);
    console.log("[DeepMicroPath Proxy] Response received, status:", res.status);

    // to prevent browser prompt for credentials
    const newHeaders = new Headers(res.headers);
    newHeaders.delete("www-authenticate");
    // to disable nginx buffering
    newHeaders.set("X-Accel-Buffering", "no");

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  } catch (error: any) {
    console.error("[DeepMicroPath Proxy] Fetch error:", {
      message: error.message,
      code: error.code,
      name: error.name,
      url: fetchUrl,
    });

    // Return a proper error response
    return NextResponse.json(
      {
        error: true,
        message: `Proxy error: ${error.message}`,
        details:
          error.code === "ECONNRESET"
            ? "Backend connection was reset. The server may have crashed or timed out."
            : undefined,
      },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
