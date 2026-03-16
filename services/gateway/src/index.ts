import express from 'express';
import { authServiceClient } from './clients/gateway.client.js';
import { userGatewayController } from './controllers/auth.controller.js';
import { parseHttpRequest } from './middleware/gateway.middleware.js';

const app = express();
const port = process.env.GATEWAY_PORT ?? 3000;

app.use(express.json());

function bootstrap() {
    const authController = userGatewayController(() => authServiceClient());

    Object.values(authController).forEach((endpoint) => {
        const { method, route, inputSchema, handler } = endpoint;
        const parse = parseHttpRequest(inputSchema);

        app[method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'](route, async (req, res) => {
            const parsed = parse(req);

            if (!parsed.success) {
                res.status(400).json({ type: "error", message: parsed.error.message });
                return;
            }

            const ctx = {
                correlationId: crypto.randomUUID(),
                requestorIp: req.ip ?? "",
            };

            const result = await handler(parsed.data, ctx);

            res.status(result.statusCode).json(
                result.type === "success" ? result.data : { message: result.message, errorCode: result.errorCode }
            );
        });
    });

    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', service: 'gateway' });
    });

    app.listen(port, () => {
        console.log(`Gateway running on port ${port}`);
    });
}

bootstrap();
