import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import Http from "../src/core";
import http from "../src/index";

type FetchCall = [input: string | URL | Request, init?: RequestInit];

const originalFetch = globalThis.fetch;

let fetchCalls: FetchCall[] = [];

function mockFetch(response: Response) {
  fetchCalls = [];
  globalThis.fetch = (async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    fetchCalls.push([input, init]);
    return response;
  }) as typeof fetch;
}

function getLastCall() {
  const call = fetchCalls.at(-1);
  expect(call).toBeDefined();
  return call!;
}

beforeEach(() => {
  fetchCalls = [];
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("Http request", () => {
  it("uses GET by default and omits the request body", async () => {
    const client = new Http();
    const response = new Response(JSON.stringify({ ok: true }), { status: 200 });

    mockFetch(response);
    const result = await client.request("/users", { data: { name: "fetchx" } });

    const [url, init] = getLastCall();

    expect(result).toBe(response);
    expect(url).toBe("/users");
    expect(init?.method).toBe("GET");
    expect(init?.body).toBeUndefined();
    expect(init?.credentials).toBe("same-origin");
  });

  it("merges baseURL, params, and headers", async () => {
    const client = new Http({
      baseURL: "https://api.example.com/",
      headers: { Accept: "application/json", "X-App": "fetchx" },
    });

    mockFetch(new Response(null, { status: 200 }));
    await client.get("/users", {
      params: { page: "1", sort: "name" },
      headers: { Authorization: "Bearer token" },
    });

    const [url, init] = getLastCall();
    const headers = init?.headers as Headers;

    expect(url).toBe("https://api.example.com/users?page=1&sort=name");
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("X-App")).toBe("fetchx");
    expect(headers.get("Authorization")).toBe("Bearer token");
  });

  it("serializes plain objects as JSON for POST requests", async () => {
    const client = new Http();

    mockFetch(new Response(null, { status: 200 }));
    await client.post("/posts", { title: "hello" });

    const [, init] = getLastCall();
    const headers = init?.headers as Headers;

    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ title: "hello" }));
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("serializes URLSearchParams with form content type", async () => {
    const client = new Http();
    const data = new URLSearchParams({ q: "fetchx" });

    mockFetch(new Response(null, { status: 200 }));
    await client.post("/search", data);

    const [, init] = getLastCall();
    const headers = init?.headers as Headers;

    expect(init?.body).toBe("q=fetchx");
    expect(headers.get("Content-Type")).toBe(
      "application/x-www-form-urlencoded;charset=UTF-8",
    );
  });

  it("removes Content-Type for FormData payloads", async () => {
    const client = new Http();
    const data = new FormData();

    data.set("file", "demo");

    mockFetch(new Response(null, { status: 200 }));
    await client.post("/upload", data, {
      headers: { "Content-Type": "application/json" },
    });

    const [, init] = getLastCall();
    const headers = init?.headers as Headers;

    expect(init?.body).toBe(data);
    expect(headers.has("Content-Type")).toBe(false);
  });

  it("throws on non-2xx responses by default", async () => {
    const client = new Http();

    mockFetch(new Response("bad request", { status: 400 }));

    await expect(client.get("/users")).rejects.toThrow(
      "Request failed with status code 400",
    );
  });

  it("respects custom validateStatus", async () => {
    const client = new Http();
    const response = new Response("bad request", { status: 400 });

    mockFetch(response);
    const result = await client.get("/users", {
      validateStatus: (status) => status < 500,
    });

    expect(result).toBe(response);
  });

  it("runs middleware in onion order and allows request mutation", async () => {
    const client = new Http();
    const events: string[] = [];

    client.use(async (ctx, next) => {
      events.push("outer-before");
      const headers = new Headers(ctx.config.headers);
      headers.set("X-Middleware", "enabled");
      ctx.config.headers = headers;
      const response = await next(ctx);
      events.push("outer-after");
      return response;
    });

    client.use(async (ctx, next) => {
      events.push("inner-before");
      expect(ctx.url).toBe("/users");
      const response = await next(ctx);
      events.push("inner-after");
      return response;
    });

    mockFetch(new Response(null, { status: 200 }));
    await client.get("/users");

    const [, init] = getLastCall();
    const headers = init?.headers as Headers;

    expect(headers.get("X-Middleware")).toBe("enabled");
    expect(events).toEqual([
      "outer-before",
      "inner-before",
      "inner-after",
      "outer-after",
    ]);
  });

  it("uses include credentials when withCredentials is enabled", async () => {
    const client = new Http();

    mockFetch(new Response(null, { status: 200 }));
    await client.get("/users", { withCredentials: true });

    const [, init] = getLastCall();

    expect(init?.credentials).toBe("include");
  });
});

describe("default export instance", () => {
  it("is callable and exposes bound helper methods", async () => {
    mockFetch(new Response(null, { status: 200 }));

    await http("/callable");
    await http.get("/bound-method");

    expect(fetchCalls).toHaveLength(2);
    expect(fetchCalls[0]?.[0]).toBe("/callable");
    expect(fetchCalls[1]?.[0]).toBe("/bound-method");
  });
});
