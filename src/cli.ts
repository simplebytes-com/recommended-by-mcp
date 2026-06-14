#!/usr/bin/env node
import { clearStoredConfig, resolveAuth, saveApiKey } from "./auth.js";
import { RecommendedByClient } from "./client.js";
import { runMcpServer } from "./server.js";

type ParsedArgs = {
  command?: string;
  apiKey?: string;
  apiBaseUrl?: string;
  help?: boolean;
  rest: string[];
};

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.command === "help") {
    printHelp();
    return;
  }

  if (args.command === "login") {
    const apiKey = args.apiKey ?? args.rest[0];
    if (!apiKey) {
      throw new Error("Usage: recommended-by-mcp login rb_live_...");
    }
    const configPath = await saveApiKey(apiKey, args.apiBaseUrl);
    process.stdout.write(`Saved recommended.by API key to ${configPath}\n`);
    return;
  }

  if (args.command === "logout") {
    const configPath = await clearStoredConfig();
    process.stdout.write(`Removed recommended.by MCP config at ${configPath}\n`);
    return;
  }

  if (args.command === "whoami") {
    const auth = await resolveAuth(args);
    const client = new RecommendedByClient(auth);
    const lists = await client.request("GET", "/lists");
    process.stdout.write(`${JSON.stringify({ ok: true, apiBaseUrl: auth.apiBaseUrl, lists }, null, 2)}\n`);
    return;
  }

  if (args.command === "config-path") {
    const { getConfigPath } = await import("./auth.js");
    process.stdout.write(`${getConfigPath()}\n`);
    return;
  }

  if (args.command && args.command !== "serve") {
    throw new Error(`Unknown command: ${args.command}`);
  }

  const auth = await resolveAuth(args);
  await runMcpServer(auth);
}

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = { rest: [] };
  const commands = new Set(["serve", "login", "logout", "whoami", "config-path", "help"]);

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--help" || value === "-h") {
      result.help = true;
    } else if (value === "--api-key") {
      result.apiKey = requireNext(argv, ++index, "--api-key");
    } else if (value === "--api-base-url") {
      result.apiBaseUrl = requireNext(argv, ++index, "--api-base-url");
    } else if (!result.command && commands.has(value)) {
      result.command = value;
    } else {
      result.rest.push(value);
    }
  }

  return result;
}

function requireNext(argv: string[], index: number, flag: string): string {
  const value = argv[index];
  if (!value) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function printHelp() {
  process.stdout.write(`recommended-by-mcp

Usage:
  recommended-by-mcp                    Start the stdio MCP server
  recommended-by-mcp serve              Start the stdio MCP server
  recommended-by-mcp login <api-key>    Save an API key locally
  recommended-by-mcp logout             Remove the saved API key
  recommended-by-mcp whoami             Validate auth by listing your lists
  recommended-by-mcp config-path        Print the local config path

Options:
  --api-key <key>         Use a key for this invocation
  --api-base-url <url>    Override the API base URL

Environment:
  RECOMMENDED_BY_API_KEY       API key used by the MCP server
  RECOMMENDED_BY_API_BASE_URL  Defaults to https://api.recommended.by/api/v1
`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
