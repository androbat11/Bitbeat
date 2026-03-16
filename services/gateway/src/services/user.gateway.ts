import { authServiceClient } from "../clients/gateway.client.js";

export type UserServiceFactory = () => ReturnType<typeof authServiceClient>;
