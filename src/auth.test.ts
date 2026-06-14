import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { clearStoredConfig, loadStoredConfig, resolveAuth, saveApiKey } from "./auth.js";

test("saves, loads, resolves, and clears auth", async () => {
  const dir = await mkdtemp(join(tmpdir(), "recommended-by-mcp-"));
  process.env.RECOMMENDED_BY_MCP_CONFIG = join(dir, "config.json");
  delete process.env.RECOMMENDED_BY_API_KEY;
  delete process.env.RECOMMENDED_BY_API_BASE_URL;

  await saveApiKey("rb_test_123", "https://example.test/api/v1");
  assert.deepEqual(await loadStoredConfig(), {
    apiKey: "rb_test_123",
    apiBaseUrl: "https://example.test/api/v1",
  });
  assert.deepEqual(await resolveAuth({}), {
    apiKey: "rb_test_123",
    apiBaseUrl: "https://example.test/api/v1",
  });

  await clearStoredConfig();
  assert.deepEqual(await loadStoredConfig(), {});
  await rm(dir, { recursive: true, force: true });
});
