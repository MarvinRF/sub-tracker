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
