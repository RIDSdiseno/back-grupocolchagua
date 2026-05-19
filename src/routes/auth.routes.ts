import { Router } from "express";
import { login, loginMicrosoft } from "../controllers/auth.controller";

const router = Router();

router.post("/login", login);
router.post("/microsoft", loginMicrosoft);

export default router;