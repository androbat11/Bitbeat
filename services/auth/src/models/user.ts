import { ObjectId } from 'mongodb';

export type UserModel<T> = {
  id?: T;
  name: string;
  lastName: string;
  email: string;
  password: string;
};
