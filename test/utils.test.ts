import { describe, expect, it } from "bun:test";

import defaults from "../src/default";
import {
  buildAbsoluteURL,
  buildURL,
  isPlainObject,
  mergeConfig,
  mergeHeaders,
} from "../src/utils";

describe("utils", () => {
  it("merges headers and lets the second config override duplicates", () => {
    const headers = mergeHeaders(
      { Accept: "application/json", "X-App": "fetchx" },
      { Accept: "text/plain", Authorization: "Bearer token" },
    );

    expect(headers.get("Accept")).toBe("text/plain");
    expect(headers.get("X-App")).toBe("fetchx");
    expect(headers.get("Authorization")).toBe("Bearer token");
  });

  it("detects plain objects only", () => {
    class Demo {}

    expect(isPlainObject({ ok: true })).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(new Demo())).toBe(false);
    expect(isPlainObject(null)).toBe(false);
  });

  it("builds an absolute url from baseURL and relative path", () => {
    expect(buildAbsoluteURL("/users", "https://api.example.com/")).toBe(
      "https://api.example.com/users",
    );
  });

  it("does not rewrite already absolute urls", () => {
    expect(
      buildAbsoluteURL("https://cdn.example.com/users", "https://api.example.com"),
    ).toBe("https://cdn.example.com/users");
  });

  it("appends params to urls and preserves existing query strings", () => {
    expect(buildURL("https://api.example.com/users?active=true", { page: "1" })).toBe(
      "https://api.example.com/users?active=true&page=1",
    );
  });

  it("accepts URLSearchParams instances", () => {
    const params = new URLSearchParams({ q: "fetchx", page: "1" });

    expect(buildURL("/search", params)).toBe("/search?q=fetchx&page=1");
  });

  it("merges config objects and preserves merged headers", () => {
    const config = mergeConfig(
      { baseURL: "https://api.example.com", headers: { Accept: "application/json" } },
      { method: "POST", headers: { Authorization: "Bearer token" } },
    );

    const headers = config.headers as Headers;

    expect(config.baseURL).toBe("https://api.example.com");
    expect(config.method).toBe("POST");
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.get("Authorization")).toBe("Bearer token");
  });

  it("returns the first config unchanged when no override is provided", () => {
    const baseConfig = { baseURL: "https://api.example.com" };

    expect(mergeConfig(baseConfig)).toBe(baseConfig);
  });
});

describe("defaults", () => {
  it("serializes plain object bodies as json and sets a default content type", () => {
    const headers = new Headers();

    const body = defaults.normalizeBody?.({ hello: "world" }, headers);

    expect(body).toBe(JSON.stringify({ hello: "world" }));
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("preserves an existing content type for plain object bodies", () => {
    const headers = new Headers({ "Content-Type": "application/custom+json" });

    defaults.normalizeBody?.({ hello: "world" }, headers);

    expect(headers.get("Content-Type")).toBe("application/custom+json");
  });

  it("serializes URLSearchParams and sets the form content type", () => {
    const headers = new Headers();

    const body = defaults.normalizeBody?.(
      new URLSearchParams({ q: "fetchx" }),
      headers,
    );

    expect(body).toBe("q=fetchx");
    expect(headers.get("Content-Type")).toBe(
      "application/x-www-form-urlencoded;charset=UTF-8",
    );
  });

  it("treats 2xx responses as success by default", () => {
    expect(defaults.validateStatus?.(200)).toBe(true);
    expect(defaults.validateStatus?.(299)).toBe(true);
    expect(defaults.validateStatus?.(300)).toBe(false);
    expect(defaults.validateStatus?.(500)).toBe(false);
  });
});
