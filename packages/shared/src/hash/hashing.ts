import bcrypt from "bcrypt";


type Hashing = {
    hashPassword(password: string, saltRounds: number): Promise<string>;
    comparePassword(password: string, hash: string): Promise<boolean>;
};

export const SALT_ROUNDS: number = 10;

export const hashingHelper: Hashing = {
    async hashPassword(password: string, saltRounds: number): Promise<string>{
        return await bcrypt.hash(password, saltRounds);
    },
    async comparePassword(password: string, hash: string): Promise<boolean>{
        return await bcrypt.compare(password, hash);
    }
}