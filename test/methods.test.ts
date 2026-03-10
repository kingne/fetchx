import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import Http from "../src/core";

type FetchCall = [input: string | URL | Request, init?: RequestInit];

const originalFetch = globalThis.fetch;

let fetchCalls: FetchCall[] = [];

function mockFetch(response = new Response(null, { status: 200 })) {
  fetchCalls = [];
  globalThis.fetch = (async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    fetchCalls.push([input, init]);
    return response;
  }) as typeof fetch;
}

function lastInit() {
  const call = fetchCalls.at(-1);
  expect(call).toBeDefined();
  return call?.[1];
}

beforeEach(() => {
  fetchCalls = [];
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("Http method helpers", () => {
  it("maps delete helper to DELETE", async () => {
    const client = new Http();

    mockFetch();
    await client.del("/resource");

    expect(lastInit()?.method).toBe("DELETE");
  });

  it("maps put helper to PUT and sends the normalized body", async () => {
    const client = new Http();

    mockFetch();
    await client.put("/resource", { id: 1 });

    const init = lastInit();

    expect(init?.method).toBe("PUT");
    expect(init?.body).toBe(JSON.stringify({ id: 1 }));
  });

  it("maps patch helper to PATCH and sends the normalized body", async () => {
    const client = new Http();

    mockFetch();
    await client.patch("/resource", { enabled: true });

    const init = lastInit();

    expect(init?.method).toBe("PATCH");
    expect(init?.body).toBe(JSON.stringify({ enabled: true }));
  });

  it("maps head helper to HEAD and strips the body", async () => {
    const client = new Http();

    mockFetch();
    await client.head("/resource", { data: { ignored: true } });

    const init = lastInit();

    expect(init?.method).toBe("HEAD");
    expect(init?.body).toBeUndefined();
  });

  it("maps options helper to OPTIONS", async () => {
    const client = new Http();

    mockFetch();
    await client.options("/resource");

    expect(lastInit()?.method).toBe("OPTIONS");
  });
});
