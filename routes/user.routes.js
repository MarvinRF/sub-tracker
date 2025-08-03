import { Router } from "express";
import {
  getUser,
  getUsers,
  createUser,
  deleteUser,
  updateUser,
} from "../controllers/user.controller";
import authorize from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.get("/", getUsers);

userRouter.post("/", createUser);

userRouter.get("/:id", authorize, getUser);

userRouter.put("/:id", authorize, updateUser);

userRouter.delete("/:id", authorize, deleteUser);

export default userRouter;
