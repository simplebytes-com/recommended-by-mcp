export class RecommendedByClient {
  constructor(
    private readonly options: {
      apiKey: string;
      apiBaseUrl: string;
    }
  ) {}

  async request(method: string, path: string, body?: unknown): Promise<unknown> {
    const response = await fetch(`${this.options.apiBaseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "recommended-by-mcp/0.1.0",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    const data = text ? parseJson(text) : null;

    if (!response.ok) {
      throw new Error(formatApiError(response.status, data));
    }

    return data;
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function formatApiError(status: number, data: unknown): string {
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as { error?: unknown }).error;
    if (typeof error === "string") {
      return `recommended.by API error ${status}: ${error}`;
    }
  }

  if (typeof data === "string" && data) {
    return `recommended.by API error ${status}: ${data}`;
  }

  return `recommended.by API error ${status}`;
}
