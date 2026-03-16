import { Db, MongoClient } from "mongodb";

type DbRegistry = {
    connect(url: string, dbName: string): Promise<Db>;
};

export const dbRegistry: DbRegistry = {
    async connect(url: string, dbName: string): Promise<Db> {
        const client = new MongoClient(url);
        await client.connect();
        return client.db(dbName);
    },
};