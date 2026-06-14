import { textResult, type ToolDefinition } from "./protocol.js";

const categories = [
  "movies",
  "tv-shows",
  "books",
  "music",
  "podcasts",
  "travel",
  "restaurants",
  "products",
  "tools",
  "courses",
  "other",
] as const;

const visibilities = [
  "public",
  "private",
  "paid_subscription",
  "paid_one_time",
] as const;

const listInputProperties = {
  title: { type: "string", description: "List title." },
  description: { type: "string", description: "Optional list description." },
  thumbnailUrl: {
    type: "string",
    description: "Optional cover image URL.",
  },
  category: { type: "string", enum: categories },
  visibility: {
    type: "string",
    enum: visibilities,
    default: "public",
  },
  priceInCents: {
    type: "number",
    description: "Required for paid list visibility.",
  },
  isRanked: { type: "boolean", default: false },
  published: { type: "boolean", default: true },
};

const itemInputProperties = {
  title: { type: "string", description: "Recommendation title." },
  subtitle: { type: "string", description: "Optional subtitle or author." },
  description: { type: "string", description: "Optional recommendation note." },
  url: { type: "string", description: "Optional destination URL." },
  imageUrl: { type: "string", description: "Optional image URL." },
  metadata: {
    type: "object",
    description: "Optional structured metadata for the item.",
  },
};

const itemSearchInputProperties = {
  title: { type: "string", description: "Search title or place/business name." },
  subtitle: {
    type: "string",
    description:
      "Optional disambiguator, such as author, artist, city, address, or location context.",
  },
  limit: { type: "number", default: 5 },
};

const itemCandidateProperties = {
  source: {
    type: "string",
    enum: ["google-books", "open-library", "itunes", "google-places", "tvdb"],
  },
  sourceId: { type: "string" },
  title: { type: "string" },
  subtitle: { type: "string" },
  description: { type: "string" },
  url: { type: "string" },
  imageUrl: { type: "string" },
  previewUrl: { type: "string" },
  previewImageUrl: { type: "string" },
  confirmationUrl: {
    type: "string",
    description: "URL to show the user when confirming this exact candidate.",
  },
  confidence: { type: "string", enum: ["exact", "likely", "possible"] },
  metadata: { type: "object" },
};

export const tools: ToolDefinition[] = [
  {
    name: "recommended_list_lists",
    description: "List all lists owned by the API key profile, including items.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "recommended_create_list",
    description: "Create a recommendation list for the API key profile.",
    inputSchema: {
      type: "object",
      properties: listInputProperties,
      required: ["title", "category"],
      additionalProperties: false,
    },
  },
  {
    name: "recommended_get_list",
    description: "Fetch one owned list by id.",
    inputSchema: {
      type: "object",
      properties: { listId: { type: "string" } },
      required: ["listId"],
      additionalProperties: false,
    },
  },
  {
    name: "recommended_update_list",
    description: "Update list metadata, visibility, pricing, or publish state.",
    inputSchema: {
      type: "object",
      properties: { listId: { type: "string" }, ...listInputProperties },
      required: ["listId"],
      additionalProperties: false,
    },
  },
  {
    name: "recommended_delete_list",
    description: "Delete an owned list.",
    inputSchema: {
      type: "object",
      properties: { listId: { type: "string" } },
      required: ["listId"],
      additionalProperties: false,
    },
  },
  {
    name: "recommended_list_items",
    description: "List items in an owned list.",
    inputSchema: {
      type: "object",
      properties: { listId: { type: "string" } },
      required: ["listId"],
      additionalProperties: false,
    },
  },
  {
    name: "recommended_search_items",
    description:
      "Search source candidates before adding an item. Use this for ambiguous books, places, podcasts, music, movies, and TV. For places, show confirmationUrl and previewImageUrl to the user before adding.",
    inputSchema: {
      type: "object",
      properties: { listId: { type: "string" }, ...itemSearchInputProperties },
      required: ["listId", "title"],
      additionalProperties: false,
    },
  },
  {
    name: "recommended_add_item_from_result",
    description:
      "Add an item from a previously returned recommended_search_items candidate. This avoids first-result auto-selection.",
    inputSchema: {
      type: "object",
      properties: {
        listId: { type: "string" },
        candidate: {
          type: "object",
          properties: itemCandidateProperties,
          required: ["source", "sourceId", "title"],
          additionalProperties: true,
        },
        description: {
          type: "string",
          description: "Optional note to override the candidate description.",
        },
      },
      required: ["listId", "candidate"],
      additionalProperties: false,
    },
  },
  {
    name: "recommended_add_item",
    description:
      "Add an item to a list. Missing URL or image can be auto-enriched from the list category.",
    inputSchema: {
      type: "object",
      properties: { listId: { type: "string" }, ...itemInputProperties },
      required: ["listId", "title"],
      additionalProperties: false,
    },
  },
  {
    name: "recommended_update_item",
    description: "Update an item in an owned list.",
    inputSchema: {
      type: "object",
      properties: {
        listId: { type: "string" },
        itemId: { type: "string" },
        ...itemInputProperties,
      },
      required: ["listId", "itemId"],
      additionalProperties: false,
    },
  },
  {
    name: "recommended_delete_item",
    description: "Delete an item from an owned list.",
    inputSchema: {
      type: "object",
      properties: {
        listId: { type: "string" },
        itemId: { type: "string" },
      },
      required: ["listId", "itemId"],
      additionalProperties: false,
    },
  },
];

type ApiClient = {
  request: (method: string, path: string, body?: unknown) => Promise<unknown>;
};

export async function callTool(client: ApiClient, name: string, args: unknown) {
  const input = asRecord(args);

  if (name === "recommended_list_lists") {
    return textResult(await client.request("GET", "/lists"));
  }

  if (name === "recommended_create_list") {
    return textResult(await client.request("POST", "/lists", withoutKeys(input)));
  }

  if (name === "recommended_get_list") {
    return textResult(await client.request("GET", `/lists/${encodeURIComponent(getRequiredString(input, "listId"))}`));
  }

  if (name === "recommended_update_list") {
    const listId = getRequiredString(input, "listId");
    return textResult(await client.request("PATCH", `/lists/${encodeURIComponent(listId)}`, withoutKeys(input, "listId")));
  }

  if (name === "recommended_delete_list") {
    const listId = getRequiredString(input, "listId");
    return textResult(await client.request("DELETE", `/lists/${encodeURIComponent(listId)}`));
  }

  if (name === "recommended_list_items") {
    const listId = getRequiredString(input, "listId");
    return textResult(await client.request("GET", `/lists/${encodeURIComponent(listId)}/items`));
  }

  if (name === "recommended_search_items") {
    const listId = getRequiredString(input, "listId");
    return textResult(
      await client.request(
        "POST",
        `/lists/${encodeURIComponent(listId)}/item-search`,
        withoutKeys(input, "listId")
      )
    );
  }

  if (name === "recommended_add_item_from_result") {
    const listId = getRequiredString(input, "listId");
    return textResult(
      await client.request(
        "POST",
        `/lists/${encodeURIComponent(listId)}/items/from-result`,
        withoutKeys(input, "listId")
      )
    );
  }

  if (name === "recommended_add_item") {
    const listId = getRequiredString(input, "listId");
    return textResult(await client.request("POST", `/lists/${encodeURIComponent(listId)}/items`, withoutKeys(input, "listId")));
  }

  if (name === "recommended_update_item") {
    const listId = getRequiredString(input, "listId");
    const itemId = getRequiredString(input, "itemId");
    return textResult(
      await client.request(
        "PATCH",
        `/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}`,
        withoutKeys(input, "listId", "itemId")
      )
    );
  }

  if (name === "recommended_delete_item") {
    const listId = getRequiredString(input, "listId");
    const itemId = getRequiredString(input, "itemId");
    return textResult(await client.request("DELETE", `/lists/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}`));
  }

  throw new Error(`Unknown tool: ${name}`);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function getRequiredString(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`${key} is required`);
  }
  return value;
}

function withoutKeys(input: Record<string, unknown>, ...keys: string[]): Record<string, unknown> {
  const blocked = new Set(keys);
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined).filter(([key]) => !blocked.has(key))
  );
}
