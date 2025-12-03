/**
 * DeepMicroPath WebSocket Client Hook
 * Provides real-time streaming for analysis results
 */

import { useCallback, useEffect, useRef, useState } from "react";

// Message types from server
export enum WSMessageType {
  CONNECTED = "connected",
  PROGRESS = "progress",
  THINKING = "thinking",
  TOOL_CALL = "tool_call",
  TOOL_RESULT = "tool_result",
  CHUNK = "chunk",
  COMPLETE = "complete",
  ERROR = "error",
  PONG = "pong",
}

// Connection states
export enum WSConnectionState {
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  RECONNECTING = "reconnecting",
  ERROR = "error",
}

// Message interfaces
export interface WSProgressMessage {
  type: WSMessageType.PROGRESS;
  job_id: string;
  progress: number;
  step: string;
  message: string;
}

export interface WSThinkingMessage {
  type: WSMessageType.THINKING;
  job_id: string;
  message: string;
}

export interface WSChunkMessage {
  type: WSMessageType.CHUNK;
  job_id: string;
  content: string;
  is_final: boolean;
}

export interface WSCompleteMessage {
  type: WSMessageType.COMPLETE;
  job_id: string;
  result: {
    prediction: string;
    execution_time: number;
    tools_used: string[];
    rounds: number;
    termination: string;
  };
}

export interface WSErrorMessage {
  type: WSMessageType.ERROR;
  job_id?: string;
  error: string;
}

export type WSMessage =
  | WSProgressMessage
  | WSThinkingMessage
  | WSChunkMessage
  | WSCompleteMessage
  | WSErrorMessage
  | { type: WSMessageType; [key: string]: any };

// Analysis request
export interface AnalysisRequest {
  question: string;
  mode: "auto" | "chat" | "microbiology" | "deepresearch";
  files?: string[];
  config?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    presence_penalty?: number;
  };
}

// Hook options
export interface UseDeepMicroPathWSOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  pingInterval?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

// Hook return type
export interface UseDeepMicroPathWSReturn {
  // Connection state
  connectionState: WSConnectionState;
  connectionId: string | null;
  isConnected: boolean;

  // Analysis state
  isAnalyzing: boolean;
  jobId: string | null;
  progress: number;
  currentStep: string;
  streamedContent: string;
  result: WSCompleteMessage["result"] | null;
  error: string | null;

  // Actions
  connect: () => void;
  disconnect: () => void;
  startAnalysis: (request: AnalysisRequest) => void;
  cancelAnalysis: () => void;
  reset: () => void;
}

// Default options
const defaultOptions: UseDeepMicroPathWSOptions = {
  autoConnect: false,
  reconnectAttempts: 3,
  reconnectInterval: 3000,
  pingInterval: 30000,
};

/**
 * WebSocket hook for DeepMicroPath real-time analysis
 */
export function useDeepMicroPathWS(
  options: UseDeepMicroPathWSOptions = {},
): UseDeepMicroPathWSReturn {
  const opts = { ...defaultOptions, ...options };

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Connection state
  const [connectionState, setConnectionState] = useState<WSConnectionState>(
    WSConnectionState.DISCONNECTED,
  );
  const [connectionId, setConnectionId] = useState<string | null>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [streamedContent, setStreamedContent] = useState("");
  const [result, setResult] = useState<WSCompleteMessage["result"] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  // Build WebSocket URL
  const getWSUrl = useCallback(() => {
    // Use current host for WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host =
      process.env.NEXT_PUBLIC_DEEPMICROPATH_WS_HOST || window.location.host;

    // If we have a specific backend URL, use it
    const backendUrl = process.env.NEXT_PUBLIC_DEEPMICROPATH_URL;
    if (backendUrl) {
      const url = new URL(backendUrl);
      return `${protocol}//${url.host}/api/v1/ws/analysis`;
    }

    return `${protocol}//${host}/api/v1/ws/analysis`;
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionState(WSConnectionState.CONNECTING);
    setError(null);

    try {
      const url = getWSUrl();
      console.log("[WS] Connecting to:", url);

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected");
        reconnectAttemptsRef.current = 0;
        opts.onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (e) {
          console.error("[WS] Failed to parse message:", e);
        }
      };

      ws.onerror = (event) => {
        console.error("[WS] Error:", event);
        setConnectionState(WSConnectionState.ERROR);
        setError("WebSocket connection error");
        opts.onError?.(new Error("WebSocket connection error"));
      };

      ws.onclose = (event) => {
        console.log("[WS] Disconnected:", event.code, event.reason);
        setConnectionState(WSConnectionState.DISCONNECTED);
        setConnectionId(null);
        clearPingInterval();
        opts.onDisconnect?.();

        // Attempt reconnection
        if (
          reconnectAttemptsRef.current < (opts.reconnectAttempts || 3) &&
          event.code !== 1000 // Normal closure
        ) {
          reconnectAttemptsRef.current++;
          setConnectionState(WSConnectionState.RECONNECTING);
          setTimeout(connect, opts.reconnectInterval);
        }
      };
    } catch (e) {
      console.error("[WS] Connection failed:", e);
      setConnectionState(WSConnectionState.ERROR);
      setError(e instanceof Error ? e.message : "Connection failed");
    }
  }, [getWSUrl, opts]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    clearPingInterval();
    if (wsRef.current) {
      wsRef.current.close(1000, "Client disconnect");
      wsRef.current = null;
    }
    setConnectionState(WSConnectionState.DISCONNECTED);
    setConnectionId(null);
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((message: WSMessage) => {
    console.log("[WS] Message:", message.type, message);

    switch (message.type) {
      case WSMessageType.CONNECTED:
        setConnectionState(WSConnectionState.CONNECTED);
        setConnectionId(message.connection_id);
        startPingInterval();
        break;

      case WSMessageType.PROGRESS:
        setProgress(message.progress);
        setCurrentStep(message.step);
        break;

      case WSMessageType.THINKING:
        setCurrentStep(message.message);
        break;

      case WSMessageType.CHUNK:
        setStreamedContent((prev) => prev + message.content);
        break;

      case WSMessageType.COMPLETE:
        setIsAnalyzing(false);
        setProgress(100);
        setResult(message.result);
        break;

      case WSMessageType.ERROR:
        setIsAnalyzing(false);
        setError(message.error);
        break;

      case WSMessageType.PONG:
        // Keepalive response, no action needed
        break;

      default:
        console.log("[WS] Unknown message type:", message.type);
    }
  }, []);

  // Start ping interval
  const startPingInterval = useCallback(() => {
    clearPingInterval();
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, opts.pingInterval);
  }, [opts.pingInterval]);

  // Clear ping interval
  const clearPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // Start analysis
  const startAnalysis = useCallback((request: AnalysisRequest) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("WebSocket not connected");
      return;
    }

    // Reset state
    setIsAnalyzing(true);
    setJobId(null);
    setProgress(0);
    setCurrentStep("");
    setStreamedContent("");
    setResult(null);
    setError(null);

    // Send analysis request
    wsRef.current.send(
      JSON.stringify({
        type: "analyze",
        ...request,
      }),
    );
  }, []);

  // Cancel analysis
  const cancelAnalysis = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && jobId) {
      wsRef.current.send(JSON.stringify({ type: "cancel", job_id: jobId }));
    }
    setIsAnalyzing(false);
  }, [jobId]);

  // Reset state
  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setJobId(null);
    setProgress(0);
    setCurrentStep("");
    setStreamedContent("");
    setResult(null);
    setError(null);
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (opts.autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [opts.autoConnect, connect, disconnect]);

  return {
    // Connection state
    connectionState,
    connectionId,
    isConnected: connectionState === WSConnectionState.CONNECTED,

    // Analysis state
    isAnalyzing,
    jobId,
    progress,
    currentStep,
    streamedContent,
    result,
    error,

    // Actions
    connect,
    disconnect,
    startAnalysis,
    cancelAnalysis,
    reset,
  };
}

export default useDeepMicroPathWS;
