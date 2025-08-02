import { Router } from "express";
import {
  getUser,
  getUsers,
  createUser,
  deleteUser,
  updateUser,
} from "../controllers/user.controller";

const userRouter = Router();

userRouter.get("/", getUsers);

userRouter.get("/:id", getUser);

userRouter.post("/", createUser);

userRouter.put("/:id", updateUser);

userRouter.delete("/:id", deleteUser);

export default userRouter;
