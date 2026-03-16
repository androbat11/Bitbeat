import { UserModel } from "../models/user.js";
import { type UserRepository } from "../repositories/user.repository.js";
import { type createEventPublisher } from "../events/publisher.js";
import { hashingHelper, SALT_ROUNDS } from "@bitbeat/shared";

type CreateUserServiceRequest = UserModel<string>;
type CreateUserServiceResponse = { id: string; name: string; lastName: string; email: string };

type UserService = {
    create(req: CreateUserServiceRequest): Promise<CreateUserServiceResponse>;
};

export async function userService(
    repository: UserRepository,
    publisher: Awaited<ReturnType<typeof createEventPublisher>>
): Promise<UserService> {
    async function create(req: CreateUserServiceRequest): Promise<CreateUserServiceResponse> {
        const passwordHashed = await hashingHelper.hashPassword(req.password, SALT_ROUNDS);

        const result = await repository.createUser({
            name: req.name,
            lastName: req.lastName,
            email: req.email,
            password: passwordHashed,
        });

        if (result.type !== "success") {
            throw new Error(result.message);
        }

        await publisher.publishUserCreated({
            id: result.data.id,
            name: req.name,
            email: req.email,
        });

        return {
            id: result.data.id,
            name: req.name,
            lastName: req.lastName,
            email: req.email,
        };
    }

    return {
        create,
    };
}

