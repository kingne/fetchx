import defaults from "./default";
import type {
  Config,
  Method,
  Middleware,
  NextFunction,
  RequestContext,
} from "./type";
import { buildAbsoluteURL, buildURL, mergeConfig } from "./utils";

class Http<D = any> {
  defaults: Config<D>;
  middlewares: Array<Middleware<D>> = [];
  constructor(config: Config<D> = {}) {
    this.defaults = mergeConfig(defaults as Config<D>, config);
  }

  use(middleware: Middleware<D>) {
    this.middlewares.push(middleware);
    return this;
  }

  private _compose() {
    return this.middlewares.reduceRight<NextFunction<D>>(
      (next, middleware) => {
        return (ctx: RequestContext<D>) => {
          return middleware(ctx, next);
        };
      },
      (ctx: RequestContext<D>) => this._dispatch(ctx),
    );
  }

  request(url: string, config?: Config<D>) {
    const mergedConfig = mergeConfig(this.defaults, config);
    const ctx: RequestContext<D> = {
      url,
      config: mergedConfig,
    };
    const fn = this._compose();
    return fn(ctx);
  }

  private async _dispatch(ctx: RequestContext<D>) {
    const finalURL = buildAbsoluteURL(ctx.url, ctx.config.baseURL);
    const urlWithParams = buildURL(finalURL, ctx.config.params);
    ctx.config.url = urlWithParams;
    ctx.url = urlWithParams;
    const method = (ctx.config.method || "GET").toUpperCase() as Method;
    ctx.config.method = method;

    const normalizeBody = ctx.config.normalizeBody || defaults.normalizeBody;
    let body = normalizeBody?.(ctx.config.data, ctx.config.headers as Headers);

    if (method === "GET" || method === "HEAD") {
      body = undefined;
    }

    ctx.body = body;
    const response = await fetch(urlWithParams, {
      method,
      headers: ctx.config.headers,
      body,
      signal: ctx.config.signal,
      credentials: ctx.config.withCredentials ? "include" : "same-origin",
    });
    const validateStatus = ctx.config.validateStatus || defaults.validateStatus;
    if (!validateStatus?.(response.status)) {
      throw new Error(`Request failed with status code ${response.status}`);
    }
    return response;
  }

  get(url: string, config?: Config<D>) {
    return this.request(url, { ...config, method: "GET" });
  }

  post(url: string, data?: D, config?: Config<D>) {
    return this.request(url, { ...config, method: "POST", data });
  }

  put(url: string, data?: D, config?: Config<D>) {
    return this.request(url, { ...config, method: "PUT", data });
  }

  del(url: string, config?: Config<D>) {
    return this.request(url, { ...config, method: "DELETE" });
  }

  patch(url: string, data?: D, config?: Config<D>) {
    return this.request(url, { ...config, method: "PATCH", data });
  }

  head(url: string, config?: Config<D>) {
    return this.request(url, { ...config, method: "HEAD" });
  }

  options(url: string, config?: Config<D>) {
    return this.request(url, { ...config, method: "OPTIONS" });
  }
}

export default Http;
