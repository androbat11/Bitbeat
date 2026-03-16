import { z } from "zod";
import { type AlteredSchema, type ApiHandler, type HttpRequestMessage } from "../services/gateway.core.js";

export const EmptyObject$Schema = z.record(z.string(), z.never());

export const normalRequestHeadersSchema = z.object({
    "content-type": z.string().optional(),
    authorization: z.string().optional(),
}).catchall(z.unknown());

export const normalResponseHeaders$Schema = z.object({
    "content-type": z.string().optional(),
}).catchall(z.unknown());

export function buildAuthenticatedResponseSchema<H extends z.ZodTypeAny, B extends z.ZodTypeAny>(
    headersSchema: H,
    bodySchema: B
) {
    return z.object({
        headers: headersSchema,
        body: bodySchema,
    }).strict();
}

// --- HttpCreateUser ---

export type HttpCreateUserResponse = {
    id?: string;
    name: string;
    lastName: string;
    email: string;
};

export const HttpCreateUserResponse$Schema: AlteredSchema<HttpCreateUserResponse> =
    z.strictObject({
        id: z.string().optional(),
        name: z.string(),
        lastName: z.string(),
        email: z.email(),
    });

export type HttpCreateUserRequest = HttpRequestMessage<
    "/create-user",
    {
        name: string;
        lastName: string;
        email: string;
        password: string;
    },
    "POST"
>;

const HttpCreateUserRequestPayload$Schema = z.object({
    name: z.string(),
    lastName: z.string(),
    email: z.email(),
    password: z.string(),
}).strict();

export const HttpCreateUserRequest$Schema: AlteredSchema<HttpCreateUserRequest> = (() => {
    return z.object({
        method: z.literal("POST"),
        route: z.literal("/create-user"),
        routeParams: EmptyObject$Schema,
        headers: normalRequestHeadersSchema,
        queryParameters: EmptyObject$Schema,
        payload: HttpCreateUserRequestPayload$Schema,
        multiParts: EmptyObject$Schema,
    }).strict();
})();

// --- Service interface ---

export type HttpAuthService = {
    HttpCreateUser: ApiHandler<HttpCreateUserRequest, HttpCreateUserResponse>;
};
