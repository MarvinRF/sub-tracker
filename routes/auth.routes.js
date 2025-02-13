import {Router} from "express";

import {signUp, signIn, signOut} from "../controllers/auth.controller.js";

const authRouter = Router();

// Path: /api/v1/auth/sing-up (POST)
authRouter.post("/sign-up", signUp);

// Path: /api/v1/auth/sing-in (POST)
authRouter.post("/sign-in", signIn);

// Path: /api/v1/auth/sing-out (POST)
authRouter.post("/sign-out",signOut);
export default authRouter;