import { createInterface } from "node:readline";
import { RecommendedByClient } from "./client.js";
import { jsonRpcError, jsonRpcResult, type JsonRpcRequest } from "./protocol.js";
import { callTool, tools } from "./tools.js";

export async function runMcpServer(options: {
  apiKey: string;
  apiBaseUrl: string;
  stdin?: NodeJS.ReadableStream;
  stdout?: NodeJS.WritableStream;
  stderr?: NodeJS.WritableStream;
}) {
  const client = new RecommendedByClient({
    apiKey: options.apiKey,
    apiBaseUrl: options.apiBaseUrl,
  });

  const input = createInterface({
    input: options.stdin ?? process.stdin,
    crlfDelay: Infinity,
  });
  const output = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;

  for await (const line of input) {
    if (!line.trim()) continue;

    let request: JsonRpcRequest;
    try {
      request = JSON.parse(line) as JsonRpcRequest;
    } catch {
      write(output, jsonRpcError(null, -32700, "Parse error"));
      continue;
    }

    if (request.jsonrpc !== "2.0" || typeof request.method !== "string") {
      write(output, jsonRpcError(request.id, -32600, "Invalid Request"));
      continue;
    }

    if (request.method.startsWith("notifications/")) {
      continue;
    }

    try {
      const result = await handleRequest(client, request);
      write(output, jsonRpcResult(request.id, result));
    } catch (error) {
      stderr.write(`${error instanceof Error ? error.message : "Tool call failed"}\n`);
      write(
        output,
        jsonRpcError(
          request.id,
          -32000,
          error instanceof Error ? error.message : "Tool call failed"
        )
      );
    }
  }
}

async function handleRequest(client: RecommendedByClient, request: JsonRpcRequest) {
  if (request.method === "initialize") {
    return {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: {
        name: "recommended.by",
        version: "0.1.0",
      },
    };
  }

  if (request.method === "tools/list") {
    return { tools };
  }

  if (request.method === "tools/call") {
    const params = asRecord(request.params);
    const name = typeof params.name === "string" ? params.name : undefined;
    if (!name) {
      throw new Error("Tool name is required");
    }
    return callTool(client, name, params.arguments);
  }

  throw new Error(`Method not found: ${request.method}`);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function write(output: NodeJS.WritableStream, payload: unknown): void {
  output.write(`${JSON.stringify(payload)}\n`);
}
