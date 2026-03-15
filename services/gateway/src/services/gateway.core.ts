import { ZodType } from "zod";

export type AlteredSchema<T> = ZodType<T, unknown>;

export type HandlerContext = {
    correlationId: string;
    requestorIp: string;
};

export type ApiHandlerResponse<R> =
    | { type: "success"; statusCode: number; contentType: "json" | "raw"; headers: Record<string, string>; data: R }
    | { type: "error"; statusCode: number; contentType: "json"; headers: Record<string, string>; message: string; errorCode: string };

export type ApiHandler<
    T extends { method: string; route: string },
    R extends Record<string, unknown>
> = {
    method: T["method"];
    route: T["route"];
    type: "new";
    inputSchema: AlteredSchema<T>;
    outputSchema: AlteredSchema<R>;
    handler: (msg: T, ctx: HandlerContext) => Promise<ApiHandlerResponse<R>>;
};

export type HttpRequestMessage<
    ROUTE,
    PAYLOAD,
    METHOD = "GET" | "POST" | "PUT" | "DELETE",
    ROUTE_PARAMS = Record<string, never>,
    QUERY_PARAMS = Record<string, never>,
    HEADERS = {},
    MULTI_PARTS = Record<string, unknown>,
> = {
    method: METHOD;
    route: ROUTE;
    routeParams: ROUTE_PARAMS;
    headers: HEADERS;
    queryParameters: QUERY_PARAMS;
    payload: PAYLOAD;
    multiParts: MULTI_PARTS;
};
