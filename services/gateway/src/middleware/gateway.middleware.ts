import { type AlteredSchema, type ApiHandlerResponse, type HandlerContext } from "../services/gateway.core.js";

const ERROR_STATUS_CODES: Record<string, number> = {
    "not-found": 404,
    "forbidden": 403,
    "invalid-input": 400,
    "timeout": 408,
    "external-service-error": 400,
};

export function buildServerErrorResponse<R extends Record<string, unknown>>(
    result: { errorCode?: string; message?: string }
): ApiHandlerResponse<R> {
    const errorCode = result.errorCode ?? "unknown";
    return {
        type: "error",
        statusCode: ERROR_STATUS_CODES[errorCode] ?? 500,
        contentType: "json",
        headers: { "content-type": "application/json" },
        message: result.message ?? "An error occurred",
        errorCode,
    };
}

export function withoutAuthentication<T, R extends Record<string, unknown>>(
    fn: (msg: T, ctx: HandlerContext) => Promise<ApiHandlerResponse<R>>
) {
    return fn;
}

export function parseHttpRequest<T>(schema: AlteredSchema<T>) {
    return (req: { method: string; path: string; params: unknown; query: unknown; headers: unknown; body: unknown }) => {
        const msg = {
            method: req.method,
            route: req.path,
            routeParams: req.params,
            queryParameters: req.query,
            headers: req.headers,
            payload: req.body,
            multiParts: {},
        };
        return schema.safeParse(msg);
    };
}
