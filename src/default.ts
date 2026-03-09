import type { Config } from "./type";
import { isPlainObject } from "./utils";

const defaults: Config<any> = {
  timeout: 0,
  normalizeBody(body: any, headers: Headers) {
    if (body instanceof FormData) {
      headers.delete("Content-Type");
    } else if (body instanceof URLSearchParams) {
      if (headers.has("Content-Type")) {
        headers.set(
          "Content-Type",
          "application/x-www-form-urlencoded;charset=UTF-8",
        );
      }
      body = body?.toString();
    } else if (isPlainObject(body)) {
      if (headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      body = JSON.stringify(body);
    }
    return body;
  },
  headers: {
    Accept: "application/json, text/plain, */*",
  },
  validateStatus: function validateStatus(status: number) {
    return status >= 200 && status < 300;
  },
};

export default defaults;
