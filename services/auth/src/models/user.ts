import { ObjectId } from "mongodb";

type UserModel = {
    id: ObjectId;
    name: string;
    lastName: string;
    email: string;
    password: string;
}