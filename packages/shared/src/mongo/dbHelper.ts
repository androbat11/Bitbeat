import { MongoClient } from "mongodb";

type MongoRegistry = {
    client(url: string): Promise<MongoClient>;
};

export const mongoRegistry: MongoRegistry = {
    async client(url: string): Promise<MongoClient> {
        return await new MongoClient(url);
    },
};