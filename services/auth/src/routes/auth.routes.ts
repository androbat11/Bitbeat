import { Router } from "express";
import { userService } from "../services/auth.service.js";


/* Find better way to describe this router */
export function authRouter(service: Awaited<ReturnType<typeof userService>>) {
    const router = Router();

    router.post("/users", async (req, res) => {
        const result = await service.create(req.body);
        res.status(201).json(result);
    });

    return router;
}
