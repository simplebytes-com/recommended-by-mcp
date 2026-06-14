import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir, platform } from "node:os";

const configFileName = "config.json";

export type StoredConfig = {
  apiKey?: string;
  apiBaseUrl?: string;
};

export function getConfigPath(): string {
  const appDir = "recommended-by-mcp";

  if (process.env.RECOMMENDED_BY_MCP_CONFIG) {
    return process.env.RECOMMENDED_BY_MCP_CONFIG;
  }

  if (platform() === "darwin") {
    return join(homedir(), "Library", "Application Support", appDir, configFileName);
  }

  if (platform() === "win32") {
    return join(process.env.APPDATA ?? join(homedir(), "AppData", "Roaming"), appDir, configFileName);
  }

  return join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), appDir, configFileName);
}

export async function loadStoredConfig(): Promise<StoredConfig> {
  try {
    const raw = await readFile(getConfigPath(), "utf8");
    const parsed = JSON.parse(raw) as StoredConfig;
    return {
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : undefined,
      apiBaseUrl: typeof parsed.apiBaseUrl === "string" ? parsed.apiBaseUrl : undefined,
    };
  } catch {
    return {};
  }
}

export async function saveApiKey(apiKey: string, apiBaseUrl?: string): Promise<string> {
  assertApiKey(apiKey);

  const configPath = getConfigPath();
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(
    configPath,
    `${JSON.stringify({ apiKey, apiBaseUrl }, null, 2)}\n`,
    { mode: 0o600 }
  );
  return configPath;
}

export async function clearStoredConfig(): Promise<string> {
  const configPath = getConfigPath();
  await rm(configPath, { force: true });
  return configPath;
}

export function assertApiKey(apiKey: string): void {
  if (!apiKey.startsWith("rb_live_") && !apiKey.startsWith("rb_test_")) {
    throw new Error("recommended.by API keys must start with rb_live_ or rb_test_");
  }
}

export async function resolveAuth(options: {
  apiKey?: string;
  apiBaseUrl?: string;
}): Promise<{ apiKey: string; apiBaseUrl: string }> {
  const stored = await loadStoredConfig();
  const apiKey = options.apiKey ?? process.env.RECOMMENDED_BY_API_KEY ?? stored.apiKey;
  const apiBaseUrl =
    options.apiBaseUrl ??
    process.env.RECOMMENDED_BY_API_BASE_URL ??
    stored.apiBaseUrl ??
    "https://api.recommended.by/api/v1";

  if (!apiKey) {
    throw new Error(
      "Missing recommended.by API key. Run `recommended-by-mcp login rb_live_...` or set RECOMMENDED_BY_API_KEY."
    );
  }

  assertApiKey(apiKey);

  return {
    apiKey,
    apiBaseUrl: apiBaseUrl.replace(/\/+$/, ""),
  };
}
