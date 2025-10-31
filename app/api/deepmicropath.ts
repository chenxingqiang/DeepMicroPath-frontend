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
  }

  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }

  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  console.log("[DeepMicroPath Proxy] ", path);
  console.log("[DeepMicroPath Base Url]", baseUrl);

  // Agent API 可能需要更长时间（特别是工具调用和多轮推理）
  const timeoutId = setTimeout(
    () => {
      controller.abort();
    },
    15 * 60 * 1000, // 15 minutes timeout for Agent API (longer than Main API)
  );

  const fetchUrl = `${baseUrl}${path}`;
  const fetchOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      Authorization: req.headers.get("Authorization") ?? "",
    },
    method: req.method,
    body: req.body,
    redirect: "manual",
    // @ts-ignore
    duplex: "half",
    signal: controller.signal,
  };

  // Filter models if custom models are configured
  if (serverConfig.customModels && req.body) {
    try {
      const clonedBody = await req.text();
      fetchOptions.body = clonedBody;

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

  try {
    const res = await fetch(fetchUrl, fetchOptions);

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
  } finally {
    clearTimeout(timeoutId);
  }
}
