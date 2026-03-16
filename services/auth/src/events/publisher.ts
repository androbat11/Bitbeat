import amqplib from "amqplib";

const EXCHANGE = "user.created";

type UserCreatedPayload = {
    id: string;
    name: string;
    email: string;
};

type EventPublisher = {
    publishUserCreated(payload: UserCreatedPayload): Promise<void>;
};

export async function createEventPublisher(amqpUrl: string): Promise<EventPublisher> {
    const connection = await amqplib.connect(amqpUrl);
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE, "fanout", { durable: true });

    async function publishUserCreated(payload: UserCreatedPayload): Promise<void> {
        channel.publish(
            EXCHANGE,
            "",
            Buffer.from(JSON.stringify(payload)),
            { persistent: true }
        );
    }

    return {
        publishUserCreated,
    };
}
