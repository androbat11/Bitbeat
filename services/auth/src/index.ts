import express from 'express';
import { ObjectId } from 'mongodb';
import { dbRegistry } from './db.js';
import { UserModel } from './models/user.js';
import { userRepository } from './repositories/user.repository.js';
import { userService } from './services/auth.service.js';
import { authRouter } from './routes/auth.routes.js';
import { createEventPublisher } from './events/publisher.js';

const app = express();
const port = process.env.AUTH_PORT ?? 3001;
const mongoUrl = process.env.MONGO_URL ?? 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME ?? 'bitbeat';
const amqpUrl = process.env.AMQP_URL ?? 'amqp://localhost';

app.use(express.json());

async function bootstrap() {
    const db = await dbRegistry.connect(mongoUrl, dbName);
    const repo = await userRepository(db.collection<UserModel<ObjectId>>('users'));
    const publisher = await createEventPublisher(amqpUrl);
    const service = await userService(repo, publisher);

    app.use('/api', authRouter(service));

    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', service: 'auth' });
    });

    app.listen(port, () => {
        console.log(`Auth running on port ${port}`);
    });
}

bootstrap();
