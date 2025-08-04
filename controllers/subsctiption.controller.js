import Subscription from "../models/subscription.model.js";

export const createSubscription = async (req, res, next) => {
  try {
    const subscrption = await Subscription.create({
      ...req.body,
      user: req.user._id,
    });

    res.status(201).json({ sucess: true, data: subscrption });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptions = async (req, res, next) => {
  try {
    if (req.user._id !== req.params.userId) {
      const error = new Error("You are not the owner of this subscription");
      error.status = 401;
      throw error;
    }

    const subscriptions = await Subscription.find({ user: req.user._id });

    res.status(200).json({ sucess: true, data: subscriptions });
  } catch (error) {
    next(error);
  }
};
