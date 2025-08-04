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

// GET /:id
export const getSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized access" });
    }

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

// PUT /:id
export const updateSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized access" });
    }

    Object.assign(subscription, req.body);
    await subscription.save();

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

// DELETE /:id
export const deleteSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized access" });
    }

    await subscription.deleteOne();

    res.status(200).json({ success: true, message: "Subscription deleted" });
  } catch (error) {
    next(error);
  }
};

// GET /user/:id
export const getUserSubscriptions = async (req, res, next) => {
  try {
    if (req.user._id !== req.params.id) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized access" });
    }

    const subscriptions = await Subscription.find({ user: req.params.id });

    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    next(error);
  }
};

// PUT /:id/cancel
export const cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "Subscription not found" });
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized access" });
    }

    subscription.status = "canceled";
    await subscription.save();

    res.status(200).json({ success: true, message: "Subscription canceled" });
  } catch (error) {
    next(error);
  }
};

// GET /upcoming-renewals
export const getUpcomingRenewals = async (req, res, next) => {
  try {
    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);

    const subscriptions = await Subscription.find({
      user: req.user._id,
      status: "active",
      renewalDate: { $gte: now, $lte: next7Days },
    });

    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    next(error);
  }
};
