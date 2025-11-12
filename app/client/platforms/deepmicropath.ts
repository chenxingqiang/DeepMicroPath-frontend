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
      let base64Data = dataUrl;
      if (dataUrl.includes(",")) {
        base64Data = dataUrl.split(",")[1];
      }

      // Remove any whitespace
      base64Data = base64Data.replace(/\s/g, "");

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
        let base64Data = file.content;

        // Handle data URL format (data:image/png;base64,xxxxx)
        if (base64Data.includes(",")) {
          base64Data = base64Data.split(",")[1];
        }

        // Remove any whitespace
        base64Data = base64Data.replace(/\s/g, "");

        // Decode base64
        const binaryString = atob(base64Data);
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
        throw new Error(
          `Failed to decode file ${file.name}: ${(error as Error).message}`,
        );
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
   * Direct inference using main API job submission endpoint
   * Submits job to /api/v1/inference/submit and polls for completion
   */
  async submitInferenceSync(
    question: string,
    mode: string,
    files: Array<{ name: string; content: string }>,
    config?: Record<string, any>,
  ): Promise<any> {
    console.log("[DeepMicroPath] Submitting inference job:", {
      question: question.substring(0, 100),
      mode,
      files: files.length,
    });

    // Upload files first and get filenames
    let inputFiles: string[] = [];
    if (files.length > 0) {
      try {
        console.log("[DeepMicroPath] Uploading files...");
        inputFiles = await this.uploadFilesFromBase64(files);
        console.log("[DeepMicroPath] Files uploaded:", inputFiles);
      } catch (error) {
        console.error("[DeepMicroPath] File upload failed:", error);
        throw new Error(`File upload failed: ${(error as Error).message}`);
      }
    }

    // Submit job
    const submitBody = {
      question,
      mode,
      input_files: inputFiles,
      parameters: {
        temperature: config?.temperature || 0.6,
        top_p: config?.top_p || 0.95,
        max_tokens: config?.max_tokens || 8000,
        presence_penalty: config?.presence_penalty || 1.1,
        ...config,
      },
    };

    const response = await fetch(`${this.baseUrl}/inference/submit`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(submitBody),
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

    const submitResult = await response.json();
    const jobId = submitResult.job_id;

    if (!jobId) {
      throw new Error("No job_id returned from inference submission");
    }

    console.log(
      `[DeepMicroPath] Job submitted: ${jobId}, polling for result...`,
    );

    // Poll for job completion
    const maxAttempts = 300; // 5 minutes max (1 second per attempt)
    let attempts = 0;
    let finalResult = null;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

      const statusResponse = await fetch(`${this.baseUrl}/inference/${jobId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!statusResponse.ok) {
        throw new Error(
          `Failed to get job status: ${statusResponse.statusText}`,
        );
      }

      const status = await statusResponse.json();
      console.log(`[DeepMicroPath] Job ${jobId} status: ${status.status}`);

      if (status.status === "COMPLETED") {
        // Get result
        const resultResponse = await fetch(
          `${this.baseUrl}/inference/${jobId}/result`,
          {
            method: "GET",
            headers: this.getHeaders(),
          },
        );

        if (!resultResponse.ok) {
          throw new Error(
            `Failed to get job result: ${resultResponse.statusText}`,
          );
        }

        finalResult = await resultResponse.json();
        break;
      } else if (status.status === "FAILED") {
        throw new Error(status.error || "Job failed");
      } else if (status.status === "CANCELED") {
        throw new Error("Job was canceled");
      }

      attempts++;
    }

    if (!finalResult) {
      throw new Error("Job did not complete within timeout (5 minutes)");
    }

    console.log("[DeepMicroPath] Inference completed:", finalResult);

    // Format result to match expected structure
    return {
      status: "completed",
      result: {
        prediction: finalResult.result?.prediction || finalResult.result,
        metadata: {
          execution_time: finalResult.duration_seconds || 0,
        },
      },
    };
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
   * Submit inference job using standard inference API
   * Used for chat, deepresearch, and auto modes
   */
  private async submitInferenceJob(
    mode: string,
    question: string,
    inputFiles: string[],
    config: any,
  ): Promise<string> {
    const requestBody = {
      mode,
      question,
      input_files: inputFiles,
      parameters: {
        temperature: config?.temperature ?? 0.7,
        top_p: config?.top_p ?? 0.95,
        max_tokens: config?.max_tokens ?? 8000,
      },
    };

    // Submit job
    const submitResponse = await fetch(`${this.baseUrl}/inference/submit`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!submitResponse.ok) {
      let msg = submitResponse.statusText;
      try {
        const data = await submitResponse.json();
        msg = data?.detail || data?.error || JSON.stringify(data);
      } catch {}
      throw new Error(
        `Inference submission failed (${submitResponse.status}): ${msg}`,
      );
    }

    const submitResult = await submitResponse.json();
    return submitResult.job_id;
  }

  /**
   * Poll job status until completion
   */
  private async pollInferenceJob(
    jobId: string,
    onUpdate?: (message: string) => void,
  ): Promise<any> {
    const maxAttempts = 300; // 10 minutes
    const pollInterval = 2000; // 2 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Get job status
      const statusResponse = await fetch(`${this.baseUrl}/inference/${jobId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!statusResponse.ok) {
        throw new Error(
          `Failed to get job status: ${statusResponse.statusText}`,
        );
      }

      const status = await statusResponse.json();
      console.log(`[DeepMicroPath] Job ${jobId} status: ${status.status}`);

      // Update progress
      if (onUpdate) {
        const progress = status.progress || 0;
        onUpdate(`⏳ Processing... (${progress.toFixed(0)}%)`);
      }

      // Check completion
      if (status.status === "COMPLETED") {
        // Get result
        const resultResponse = await fetch(
          `${this.baseUrl}/inference/${jobId}/result`,
          {
            method: "GET",
            headers: this.getHeaders(),
          },
        );

        if (!resultResponse.ok) {
          throw new Error(`Failed to get result: ${resultResponse.statusText}`);
        }

        const result = await resultResponse.json();
        return result.result;
      }

      if (status.status === "FAILED") {
        throw new Error(status.error || "Job failed");
      }

      if (status.status === "CANCELED") {
        throw new Error("Job was canceled");
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error("Job polling timeout (10 minutes exceeded)");
  }

  /**
   * Main chat method - implements LLMApi interface
   * - Microbiology Report: uses Agent API (with tools)
   * - Other modes: uses Inference API (standard jobs)
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

    // Determine mode and API
    let mode = "chat";
    let useAgentApi = false;

    if (modelName.includes("microbiology")) {
      mode = "microbiology";
      useAgentApi = true; // Only microbiology uses Agent API
    } else if (modelName.includes("deepresearch")) {
      mode = "deepresearch";
    } else if (modelName.includes("auto")) {
      mode = "auto";
    } else {
      mode = "chat";
    }

    console.log(`[DeepMicroPath] Mode: ${mode}, UseAgentAPI: ${useAgentApi}`);

    // Handle attached files - convert to Base64 format
    const files: Array<{ name: string; content: string }> = [];
    let fileUrls: string[] = [];

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

    // Upload files if needed
    if (files.length > 0) {
      try {
        console.log(`[DeepMicroPath] Uploading ${files.length} files...`);
        fileUrls = await this.uploadFilesFromBase64(files);
        console.log(`[DeepMicroPath] Files uploaded:`, fileUrls);
      } catch (error) {
        console.error("[DeepMicroPath] File upload failed:", error);
        if (options.onError) {
          options.onError(error as Error);
        } else {
          options.onFinish(
            `❌ File upload failed: ${(error as Error).message}`,
            new Response(),
          );
        }
        return;
      }
    }

    // Show loading indicator
    let loadingInterval: NodeJS.Timeout | null = null;
    const loadingMessages =
      mode === "microbiology"
        ? [
            "🧬 Analyzing microbial data...",
            "🔬 Processing samples...",
            "📊 Generating insights...",
          ]
        : mode === "deepresearch"
        ? [
            "🔍 Deep researching...",
            "📚 Analyzing sources...",
            "💡 Synthesizing...",
          ]
        : mode === "auto"
        ? ["⚙️ Auto-detecting...", "📊 Processing...", "💡 Analyzing..."]
        : ["💬 Generating response...", "✨ Thinking...", "📝 Writing..."];

    try {
      // Start loading indicator
      let messageIndex = 0;
      if (options.onUpdate) {
        options.onUpdate(loadingMessages[0], "");
        loadingInterval = setInterval(() => {
          if (options.onUpdate) {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            options.onUpdate(loadingMessages[messageIndex], "");
          }
        }, 2000);
      }

      // Use unified inference submission for all modes
      const result = await this.submitInferenceSync(question, mode, files, {
        temperature: options.config.temperature || 0.7,
        top_p: options.config.top_p || 0.95,
        presence_penalty: options.config.presence_penalty || 1.1,
        max_tokens: (options.config as any).max_tokens || 8000,
      });

      // Extract final result
      const inferenceResult = result.result;
      let finalMessage = inferenceResult?.prediction || "";

      // Add metadata footer if available
      if (
        inferenceResult?.metadata &&
        inferenceResult.metadata.execution_time
      ) {
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

      options.onFinish(finalMessage, new Response());
    } catch (error) {
      console.error(`[DeepMicroPath] ${mode} error:`, error);

      let errorMessage = (error as Error).message;

      // Provide more helpful error messages
      if (errorMessage.includes("All connection attempts failed")) {
        errorMessage =
          "❌ Backend service error: Cannot connect to inference engine (SGLang). Please ensure the SGLang service is running on port 6001.";
      } else if (
        errorMessage.includes("socket hang up") ||
        errorMessage.includes("ECONNRESET")
      ) {
        errorMessage =
          "❌ Connection lost: The backend server closed the connection unexpectedly. This may be due to timeout or server crash.";
      } else if (errorMessage.includes("500")) {
        errorMessage = `❌ Server error: ${errorMessage}. Please check backend logs.`;
      } else {
        errorMessage = `❌ Error: ${errorMessage}`;
      }

      if (options.onError) {
        options.onError(new Error(errorMessage));
      } else {
        options.onFinish(errorMessage, new Response());
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
