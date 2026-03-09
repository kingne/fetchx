export function mergeHeaders(
  headers1: Record<string, string> | Headers,
  headers2: Record<string, string> | Headers,
): Headers {
  const mergedHeaders = new Headers(headers1);
  const headers2Obj = new Headers(headers2);
  for (const [key, value] of headers2Obj) {
    mergedHeaders.set(key, value);
  }

  return mergedHeaders;
}


export function isPlainObject(value: unknown): value is Record<string, any> {
  if (Object.prototype.toString.call(value) !== "[object Object]") {
    return false;
  }

  const proto = Object.getPrototypeOf(value);

  return proto === null || proto === Object.prototype;
}

export function buildAbsoluteURL(url: string, baseURL?: string): string {
  if (baseURL && !/^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url)) {
    return baseURL.replace(/\/+$/, "") + "/" + url.replace(/^\/+/, "");
  }
  return url;
}
