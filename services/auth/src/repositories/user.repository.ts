import { UserModel } from '../models/user.js';
import { ErrorResponse, SuccessResponse } from '../types/responses.js';
import { Collection, ObjectId } from 'mongodb';

type CreateUserRequest = UserModel<ObjectId>;
type CreateUserResponse = SuccessResponse<{ id: string }> | ErrorResponse;

/* Find better descriptive name according the project */
export type UserRepository = {
  createUser(req: CreateUserRequest): Promise<CreateUserResponse>;
};

export async function userRepository<T extends Collection<UserModel<ObjectId>>>(
  collection: T,
): Promise<UserRepository> {
  const createUser = async (
    req: CreateUserRequest,
  ): Promise<CreateUserResponse> => {
    const result = await collection.insertOne(req);
    if (!result.acknowledged) {
      return {
        /* Currently that's not telling me anything */
        type: "error",
        message: "Unable to insert user",
      };
    }

    return {
      type: "success",
      data: { id: result.insertedId.toString() },
    };
  };

  return {
    createUser,
  };
}
