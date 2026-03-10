import type { BodyInit } from "bun";
import type Http from "./core";

export interface Config<D> {
  url?: string;
  method?: Method;
  baseURL?: string;
  timeout?: number;
  normalizeBody?: (body: any, headers: Headers) => any;
  validateStatus?: (status: number) => boolean;
  headers?: Record<string, string> | Headers;
  params?: Record<string, any> | URLSearchParams;
  data?: D;
  signal?: AbortSignal;
  withCredentials?: boolean;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
}

export type Method =
  | "GET"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | "POST"
  | "PUT"
  | "PATCH"
  
   
export type RequestContext<D = any> = {
  url: string;
  config: Config<D>;
  body?: BodyInit | null;
};

export type Middleware<D = any> = (
  ctx: RequestContext<D>,
  next: NextFunction<D>,
) => Promise<Response>;

export type NextFunction<D = any> = (ctx: RequestContext<D>) => Promise<Response>;

export type HttpInstance<D> = Http<D> & {
  (url: string, config?: Config<D>): Promise<Response>;
};
