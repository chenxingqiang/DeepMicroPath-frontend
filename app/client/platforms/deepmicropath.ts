/**
 * DeepMicroPath API Client
 * Provides integration with DeepMicroPath backend for microbiology inference
 */

import { ChatOptions, LLMApi, LLMModel, LLMUsage, SpeechOptions } from "../api";
import { getClientConfig } from "@/app/config/client";

export interface DeepMicroPathConfig {
  baseUrl: string;
  apiKey?: string;
}

export interface InferenceRequest {
  mode: "auto" | "chat" | "deepresearch" | "microbiology-report";
  question: string;
  input_files: string[];
  parameters?: Record<string, any>;
}

export interface InferenceJobResponse {
  job_id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELED";
  message?: string;
}

export interface JobStatus {
  job_id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELED";
  mode: string;
  question: string;
  input_files: string[];
  progress?: number;
  submitted_at: string;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  error?: string;
}

export interface JobResult {
  job_id: string;
  status: string;
  result: {
    prediction?: string;
    report?: any;
    metadata?: any;
  };
  completed_at?: string;
  duration_seconds?: number;
}

export interface UploadedFile {
  filename: string;
  size: number;
  upload_time: string;
  url: string;
}

export class DeepMicroPathApi implements LLMApi {
  private baseUrl: string;
  private apiKey?: string;
  private pollingInterval: number = 2000; // 2 seconds
  private maxPollAttempts: number = 300; // 10 minutes max

  constructor() {
    const config = getClientConfig();
    // Use Next.js proxy path for API calls (avoids CORS)
    // The proxy will forward /api/deepmicropath/* to http://172.20.1.38:8000/api/v1/*
    this.baseUrl = "/api/deepmicropath";
    this.apiKey = process.env.NEXT_PUBLIC_DEEPMICROPATH_API_KEY;

    console.log("[DeepMicroPath] Initialized with baseUrl:", this.baseUrl);
  }

  /**
   * Get request headers
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Upload file to DeepMicroPath backend
   */
  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.baseUrl}/files/upload`, {
      method: "POST",
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = JSON.stringify(errorData, null, 2);
        } else {
          errorMessage = await response.text();
        }
      } catch (e) {
        console.warn("[DeepMicroPath] Could not parse upload error:", e);
      }
      throw new Error(`File upload failed: ${errorMessage}`);
    }

    const result = await response.json();
    console.log("[DeepMicroPath] File uploaded:", result);
    return result.uploaded[0]?.filename || result.filename;
  }

  /**
   * Upload file from base64 data URL
   */
  async uploadFileFromBase64(
    dataUrl: string,
    filename: string,
  ): Promise<string> {
    try {
      // Extract base64 data from data URL
      const base64Data = dataUrl.split(",")[1];

      // Convert base64 to binary
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create blob and file
      const blob = new Blob([bytes]);
      const file = new File([blob], filename);

      // Upload using standard method
      return await this.uploadFile(file);
    } catch (error) {
      console.error("[DeepMicroPath] Error uploading from base64:", error);
      throw error;
    }
  }

  /**
   * Upload multiple files from base64 and return their URLs
   */
  async uploadFilesFromBase64(
    files: Array<{ name: string; content: string }>,
  ): Promise<string[]> {
    const formData = new FormData();

    // Convert each base64 file to Blob and add to FormData
    for (const file of files) {
      try {
        // Decode base64
        const binaryString = atob(file.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Create blob and file
        const blob = new Blob([bytes]);
        const fileObj = new File([blob], file.name);
        formData.append("files", fileObj);
      } catch (error) {
        console.error(
          `[DeepMicroPath] Error preparing file ${file.name}:`,
          error,
        );
        throw error;
      }
    }

    // Upload all files at once
    const response = await fetch(`${this.baseUrl}/files/upload`, {
      method: "POST",
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = JSON.stringify(errorData, null, 2);
        } else {
          errorMessage = await response.text();
        }
      } catch (e) {
        console.warn("[DeepMicroPath] Could not parse upload error:", e);
      }
      throw new Error(`File upload failed: ${errorMessage}`);
    }

    const result = await response.json();
    console.log("[DeepMicroPath] Files uploaded:", result);

    // Extract public URLs from uploaded files
    const urls =
      result.uploaded?.map((file: any) => file.public_url || file.url) || [];

    if (urls.length === 0 && files.length > 0) {
      throw new Error("No file URLs returned from upload");
    }

    return urls;
  }

  /**
   * List uploaded files
   */
  async listFiles(): Promise<UploadedFile[]> {
    const response = await fetch(`${this.baseUrl}/files`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    const result = await response.json();
    return result.files || [];
  }

  /**
   * Direct inference using Agent API sync endpoint
   * This directly calls the Agent API /api/v1/agent/inference/sync endpoint
   */
  async submitInferenceSync(
    question: string,
    mode: string,
    files: Array<{ name: string; content: string }>,
    config?: Record<string, any>,
  ): Promise<any> {
    console.log("[DeepMicroPath] Submitting sync inference:", {
      question: question.substring(0, 100),
      mode,
      files: files.length,
    });

    // Upload files first and get URLs
    let fileUrls: string[] = [];
    if (files.length > 0) {
      try {
        console.log("[DeepMicroPath] Uploading files first...");
        fileUrls = await this.uploadFilesFromBase64(files);
        console.log("[DeepMicroPath] Files uploaded:", fileUrls);
      } catch (error) {
        console.error("[DeepMicroPath] File upload failed:", error);
        throw new Error(`File upload failed: ${(error as Error).message}`);
      }
    }

    const requestBody = {
      question,
      mode,
      files: fileUrls.length > 0 ? fileUrls : undefined,
      config: {
        temperature: config?.temperature || 0.6,
        top_p: config?.top_p || 0.95,
        presence_penalty: config?.presence_penalty || 1.1,
        planning_port: config?.planning_port || 6001,
        max_rounds: config?.max_rounds,
        timeout: config?.timeout,
        ...config,
      },
    };

    const response = await fetch(`${this.baseUrl}/agent/inference/sync`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || JSON.stringify(errorData, null, 2);
        } else {
          errorMessage = await response.text();
        }
      } catch (e) {
        console.warn("[DeepMicroPath] Could not parse error response:", e);
      }
      console.error("[DeepMicroPath] Sync inference error:", errorMessage);
      throw new Error(`Inference failed (${response.status}): ${errorMessage}`);
    }

    const result = await response.json();

    if (result.status === "error") {
      throw new Error(result.error || "Inference failed");
    }

    if (result.status !== "completed") {
      throw new Error(`Unexpected status: ${result.status}`);
    }

    console.log(
      "[DeepMicroPath] Inference completed:",
      result.result?.metadata,
    );
    return result;
  }

  /**
   * Submit inference job (deprecated, kept for compatibility)
   */
  async submitInference(request: InferenceRequest): Promise<string> {
    // For backward compatibility, but now we use sync endpoint directly
    throw new Error("Use submitInferenceSync instead");
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await fetch(`${this.baseUrl}/agent/inference/${jobId}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Job not found: ${jobId}`);
      }
      throw new Error(`Failed to get job status: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get job result
   */
  async getJobResult(jobId: string): Promise<JobResult> {
    const response = await fetch(
      `${this.baseUrl}/agent/inference/${jobId}/result`,
      {
        method: "GET",
        headers: this.getHeaders(),
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Job not found: ${jobId}`);
      }
      if (response.status === 400) {
        throw new Error(`Job not completed yet`);
      }
      throw new Error(`Failed to get job result: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Cancel a running job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/agent/inference/${jobId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.status === "CANCELED";
  }

  /**
   * Poll job status until completion
   */
  private async pollJobStatus(
    jobId: string,
    onUpdate?: (status: JobStatus) => void,
  ): Promise<JobResult> {
    let attempts = 0;

    while (attempts < this.maxPollAttempts) {
      try {
        const status = await this.getJobStatus(jobId);

        // Notify update callback
        if (onUpdate) {
          onUpdate(status);
        }

        console.log(`[DeepMicroPath] Job ${jobId} status:`, status.status);

        if (status.status === "COMPLETED") {
          return await this.getJobResult(jobId);
        }

        if (status.status === "FAILED") {
          throw new Error(status.error || "Job failed");
        }

        if (status.status === "CANCELED") {
          throw new Error("Job was canceled");
        }

        // Wait before next poll
        await new Promise((resolve) =>
          setTimeout(resolve, this.pollingInterval),
        );
        attempts++;
      } catch (error) {
        console.error("[DeepMicroPath] Polling error:", error);
        throw error;
      }
    }

    throw new Error("Job polling timeout (maximum wait time exceeded)");
  }

  /**
   * Convert file to base64
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Simple chat using SGLang directly (OpenAI-compatible API)
   */
  private async simpleChatCompletion(
    messages: any[],
    config: any,
  ): Promise<string> {
    // Use last user message as question for fast path
    const last = messages[messages.length - 1];
    const question =
      typeof last.content === "string"
        ? last.content
        : Array.isArray(last.content)
        ? last.content.find((c: any) => c.type === "text")?.text || ""
        : "";

    const requestBody = {
      question,
      mode: "default",
      config: {
        temperature: config?.temperature ?? 0.7,
        top_p: config?.top_p ?? 0.95,
        presence_penalty: config?.presence_penalty ?? 1.1,
        planning_port: config?.planning_port ?? 6001,
        max_rounds: 1,
        timeout: 120,
      },
    };

    // Call Agent API sync endpoint for reliability (fast path)
    const response = await fetch(`${this.baseUrl}/agent/inference/sync`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let msg = response.statusText;
      try {
        const data = await response.json();
        msg = data?.error || JSON.stringify(data);
      } catch {}
      throw new Error(`Chat completion failed (${response.status}): ${msg}`);
    }

    const result = await response.json();
    if (result?.status !== "completed") {
      throw new Error(`Unexpected status: ${result?.status || "unknown"}`);
    }
    return result?.result?.prediction || "";
  }

  /**
   * Main chat method - implements LLMApi interface
   * Uses simple chat for chat mode, Agent API for others
   */
  async chat(options: ChatOptions): Promise<void> {
    const messages = options.messages;
    const lastMessage = messages[messages.length - 1];

    // Extract question from last user message
    let question = "";
    if (typeof lastMessage.content === "string") {
      question = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      // Handle multimodal content
      const textContent = lastMessage.content.find((c) => c.type === "text");
      if (textContent && textContent.text) {
        question = textContent.text;
      }
    }

    const modelName = options.config.model;

    // Chat mode: use simple fast path (direct SGLang)
    if (modelName.includes("chat")) {
      console.log("[DeepMicroPath] Using simple chat mode (fast)");

      try {
        if (options.onUpdate) {
          options.onUpdate("💬 Generating response...", "");
        }

        const response = await this.simpleChatCompletion(
          messages,
          options.config,
        );
        options.onFinish(response, new Response());
        return;
      } catch (error) {
        console.error("[DeepMicroPath] Simple chat error:", error);
        if (options.onError) {
          options.onError(error as Error);
        } else {
          options.onFinish(
            `❌ Error: ${(error as Error).message}`,
            new Response(),
          );
        }
        return;
      }
    }

    // Other modes: use Agent API
    // deepmicropath-deepresearch -> default (Agent API uses "default" for research)
    // deepmicropath-microbiology-report -> microbiology (Agent API mode)
    // deepmicropath-auto -> auto
    let mode = "auto";
    if (modelName.includes("microbiology")) {
      mode = "microbiology";
    } else if (modelName.includes("deepresearch")) {
      mode = "default";
    } else {
      mode = "auto";
    }

    // Handle attached files - convert to Base64 format expected by Agent API
    const files: Array<{ name: string; content: string }> = [];

    // Extract image_url attachments from multimodal content
    if (Array.isArray(lastMessage.content)) {
      const imageContents = lastMessage.content.filter(
        (c) => c.type === "image_url",
      );

      for (let i = 0; i < imageContents.length; i++) {
        const imageUrl = imageContents[i].image_url?.url;
        if (imageUrl) {
          try {
            // Generate filename based on index and type
            const ext = imageUrl.startsWith("data:image/")
              ? imageUrl.split(";")[0].split("/")[1] || "png"
              : "dat";
            const filename = `attachment_${Date.now()}_${i}.${ext}`;

            // Extract base64 from data URL
            const base64 = imageUrl.includes(",")
              ? imageUrl.split(",")[1]
              : imageUrl;

            files.push({
              name: filename,
              content: base64,
            });

            console.log(`[DeepMicroPath] Prepared attachment: ${filename}`);
          } catch (error) {
            console.error(
              `[DeepMicroPath] Failed to prepare attachment:`,
              error,
            );
          }
        }
      }
    }

    // Show loading indicator
    let loadingInterval: NodeJS.Timeout | null = null;
    if (options.onUpdate) {
      const loadingMessages =
        mode === "microbiology"
          ? [
              "🧬 Analyzing microbial data...",
              "🔬 Processing samples...",
              "📊 Generating insights...",
            ]
          : mode === "default"
          ? ["🔍 Researching...", "📚 Analyzing...", "💡 Synthesizing..."]
          : [
              "⚙️ Processing request...",
              "📊 Analyzing data...",
              "💡 Preparing results...",
            ];

      let messageIndex = 0;
      options.onUpdate(loadingMessages[0], "");

      loadingInterval = setInterval(() => {
        if (options.onUpdate) {
          messageIndex = (messageIndex + 1) % loadingMessages.length;
          options.onUpdate(loadingMessages[messageIndex], "");
        }
      }, 2000);
    }

    try {
      // Direct sync inference call to Agent API
      const result = await this.submitInferenceSync(question, mode, files, {
        temperature: options.config.temperature,
        top_p: options.config.top_p,
        presence_penalty: options.config.presence_penalty || 1.1,
      });

      // Extract final result from Agent API response
      const inferenceResult = result.result;
      let finalMessage = inferenceResult?.prediction || "";

      // Add metadata footer with Agent API metadata
      if (inferenceResult?.metadata) {
        const metadata = inferenceResult.metadata;
        finalMessage += `\n\n---\n`;
        finalMessage += `⏱️ 执行时间: ${metadata.execution_time?.toFixed(1)}s`;
        if (metadata.rounds) {
          finalMessage += ` | 🔄 推理轮数: ${metadata.rounds}`;
        }
        if (metadata.tools_used && metadata.tools_used.length > 0) {
          finalMessage += ` | 🔧 使用工具: ${metadata.tools_used.join(", ")}`;
        }
      }

      // Call finish callback
      options.onFinish(finalMessage, new Response());
    } catch (error) {
      console.error("[DeepMicroPath] Chat error:", error);
      if (options.onError) {
        options.onError(error as Error);
      } else {
        options.onFinish(
          `❌ Error: ${(error as Error).message}`,
          new Response(),
        );
      }
    } finally {
      // Always clear loading indicator on completion
      if (loadingInterval) {
        clearInterval(loadingInterval);
      }
    }
  }

  /**
   * Format structured microbiology report
   */
  private formatReport(report: any): string {
    if (typeof report === "string") {
      return report;
    }

    let formatted = "# 微生物AI分析解读报告\n\n";

    // Sample Information
    if (report.sample_info || report["样本信息"]) {
      const info = report.sample_info || report["样本信息"];
      formatted += "## 样本信息总览\n\n";
      formatted += this.formatObject(info) + "\n\n";
    }

    // Microbial Community Analysis
    if (report.community_analysis || report["微生物群落分析"]) {
      const analysis = report.community_analysis || report["微生物群落分析"];
      formatted += "## 微生物群落分析\n\n";
      formatted += this.formatObject(analysis) + "\n\n";
    }

    // Clinical Significance
    if (report.clinical_significance || report["临床意义解读"]) {
      const clinical = report.clinical_significance || report["临床意义解读"];
      formatted += "## 临床意义解读\n\n";
      formatted += this.formatObject(clinical) + "\n\n";
    }

    // Health Recommendations
    if (report.recommendations || report["健康建议"]) {
      const recommendations = report.recommendations || report["健康建议"];
      formatted += "## 健康建议\n\n";
      formatted += this.formatObject(recommendations) + "\n\n";
    }

    // References
    if (report.references || report["参考文献"]) {
      const references = report.references || report["参考文献"];
      formatted += "## 参考文献\n\n";
      formatted += this.formatArray(references) + "\n\n";
    }

    return formatted;
  }

  /**
   * Format object for display
   */
  private formatObject(obj: any, indent: number = 0): string {
    if (typeof obj === "string") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return this.formatArray(obj, indent);
    }

    const prefix = "  ".repeat(indent);
    let result = "";

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && value !== null) {
        result += `${prefix}**${key}:**\n`;
        result += this.formatObject(value, indent + 1);
      } else {
        result += `${prefix}- **${key}**: ${value}\n`;
      }
    }

    return result;
  }

  /**
   * Format array for display
   */
  private formatArray(arr: any[], indent: number = 0): string {
    const prefix = "  ".repeat(indent);
    return arr
      .map((item, idx) => {
        if (typeof item === "object") {
          return `${prefix}${idx + 1}. ${this.formatObject(item, indent + 1)}`;
        }
        return `${prefix}${idx + 1}. ${item}`;
      })
      .join("\n");
  }

  /**
   * Speech synthesis (not supported)
   */
  async speech(options: SpeechOptions): Promise<ArrayBuffer> {
    throw new Error("Speech synthesis not supported by DeepMicroPath");
  }

  /**
   * Get usage statistics (not implemented)
   */
  async usage(): Promise<LLMUsage> {
    return {
      used: 0,
      total: 0,
    };
  }

  /**
   * Get available models
   */
  async models(): Promise<LLMModel[]> {
    // DeepMicroPath uses inference modes rather than models
    return [
      {
        name: "deepmicropath-auto",
        displayName: "DeepMicroPath (Auto Mode)",
        available: true,
        provider: {
          id: "deepmicropath",
          providerName: "auto",
          providerType: "deepmicropath",
          sorted: 1,
        },
        sorted: 1,
      },
      {
        name: "deepmicropath-chat",
        displayName: "DeepMicroPath (Chat Mode)",
        available: true,
        provider: {
          id: "deepmicropath",
          providerName: "chat",
          providerType: "deepmicropath",
          sorted: 2,
        },
        sorted: 2,
      },
      {
        name: "deepmicropath-deepresearch",
        displayName: "DeepMicroPath (Deep Research)",
        available: true,
        provider: {
          id: "deepmicropath",
          providerName: "deepresearch",
          providerType: "deepmicropath",
          sorted: 3,
        },
        sorted: 3,
      },
      {
        name: "deepmicropath-microbiology-report",
        displayName: "DeepMicroPath (Microbiology Report)",
        available: true,
        provider: {
          id: "deepmicropath",
          providerName: "microbiology-report",
          providerType: "deepmicropath",
          sorted: 4,
        },
        sorted: 4,
      },
    ];
  }
}
