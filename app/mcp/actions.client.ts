// Client-side stub for MCP actions (used in static export builds)
import {
  McpConfigData,
  McpRequestMessage,
  ServerConfig,
  ServerStatusResponse,
} from "./types";

// All MCP functions return disabled/empty state in client builds
export async function getClientsStatus(): Promise<
  Record<string, ServerStatusResponse>
> {
  return {};
}

export async function getClientTools(clientId: string) {
  return null;
}

export async function getAvailableClientsCount() {
  return 0;
}

export async function getAllTools() {
  return [];
}

export async function initializeMcpSystem() {
  console.warn("MCP is disabled in static export builds");
  return undefined;
}

export async function addMcpServer(clientId: string, config: ServerConfig) {
  throw new Error("MCP is disabled in static export builds");
}

export async function pauseMcpServer(clientId: string) {
  throw new Error("MCP is disabled in static export builds");
}

export async function resumeMcpServer(clientId: string): Promise<void> {
  throw new Error("MCP is disabled in static export builds");
}

export async function removeMcpServer(clientId: string) {
  throw new Error("MCP is disabled in static export builds");
}

export async function restartAllClients() {
  throw new Error("MCP is disabled in static export builds");
}

export async function executeMcpAction(
  clientId: string,
  request: McpRequestMessage,
) {
  throw new Error("MCP is disabled in static export builds");
}

export async function getMcpConfigFromFile(): Promise<McpConfigData> {
  return {
    mcpServers: {},
  };
}

export async function isMcpEnabled() {
  return false;
}
