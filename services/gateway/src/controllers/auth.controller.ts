import { UserServiceFactory } from "../services/user.gateway.js";
import { type HttpAuthService, HttpCreateUserRequest$Schema, HttpCreateUserResponse$Schema } from "../types/http-auth.js";
import { buildServerErrorResponse, withoutAuthentication } from "../middleware/gateway.middleware.js";

export function userGatewayController(userServiceFactory: UserServiceFactory): HttpAuthService {
    return {
        HttpCreateUser: {
            method: "POST",
            route: "/create-user",
            type: "new",
            inputSchema: HttpCreateUserRequest$Schema,
            outputSchema: HttpCreateUserResponse$Schema,
            handler: withoutAuthentication(async (msg, _ctx) => {
                const service = await userServiceFactory();
                const result = await service.createUser(msg.payload);

                if (result.type !== "success") {
                    return buildServerErrorResponse(result);
                }

                return {
                    type: "success",
                    statusCode: 201,
                    contentType: "json",
                    headers: { "content-type": "application/json" },
                    data: {
                        id: result.data.id,
                        name: result.data.name,
                        lastName: result.data.lastName,
                        email: result.data.email,
                    },
                };
            }),
        },
    };
}
