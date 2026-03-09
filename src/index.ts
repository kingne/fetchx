import Http from "./core";
import type { Config, HttpInstance } from "./type";

function createInstance<D>(defaults?: Config<D>) {
  const context = new Http<D>(defaults);

  // 绑定 request
  const instance = context.request.bind(context) as HttpInstance<D>;

  // 拷贝 prototype 方法
  Object.getOwnPropertyNames(Http.prototype).forEach((key) => {
    if (key !== "constructor" && key !== "request") {
      const value = (context as any)[key];
      if (typeof value === "function") {
        (instance as any)[key] = value.bind(context);
      }
    }
  });

  // 拷贝实例属性
  Object.assign(instance, context);

  return instance;
}

const http = createInstance();

export default http;
