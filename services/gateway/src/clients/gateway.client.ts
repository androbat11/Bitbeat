const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL ?? "http://localhost:3001";

type CreateUserRequest = {
    name: string;
    lastName: string;
    email: string;
    password: string;
};

type CreateUserResult =
    | { type: "success"; data: { id?: string; name: string; lastName: string; email: string } }
    | { type: "error"; errorCode: string; message: string };

type AuthClient = {
    createUser(req: CreateUserRequest): Promise<CreateUserResult>;
};

export async function authServiceClient(): Promise<AuthClient> {
    return {
        async createUser(req) {
            const res = await fetch(`${AUTH_SERVICE_URL}/api/users`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(req),
            });

            const data = await res.json();

            if (!res.ok) {
                return { type: "error", errorCode: "external-service-error", message: data.message ?? "Auth service error" };
            }

            return { type: "success", data };
        },
    };
}
