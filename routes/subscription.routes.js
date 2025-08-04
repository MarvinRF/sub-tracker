import { Router } from "express";
import authorize from "../middlewares/auth.middleware.js";
import {
  createSubscription,
  getSubscriptions,
} from "../controllers/subsctiption.controller.js";

const subscriptionRouter = Router();

subscriptionRouter.get("/", authorize, getSubscriptions);

subscriptionRouter.get("/:id", (req, res) =>
  res.send({ title: "GET subscriptions details" })
);

subscriptionRouter.post("/", authorize, createSubscription);

subscriptionRouter.put("/", (req, res) =>
  res.send({ title: "UPDATE subscriptions" })
);

subscriptionRouter.delete("/", (req, res) =>
  res.send({ title: "DELETE subscription" })
);

subscriptionRouter.get("/user/:id", (req, res) =>
  res.send({ title: "GET All user subscriptions" })
);

subscriptionRouter.put("/:id/cancel", (req, res) =>
  res.send({ title: "Cancel subscriptions" })
);

subscriptionRouter.get("/upcoming-renewals", (req, res) =>
  res.send({ title: "GET upcoming renewals" })
);

export default subscriptionRouter;
