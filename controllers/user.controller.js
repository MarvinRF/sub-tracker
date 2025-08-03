import User from "../models/user.model.js";

// GET /users
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json({ sucess: true, data: users });
  } catch (error) {
    next(error);
  }
};

// GET /users/:id
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ sucess: true, data: user });
  } catch (error) {
    next(error);
  }
};

// POST /users
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("Email is already in use");
      error.statusCode = 400;
      throw error;
    }

    const user = await User.create({ name, email, password });

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.status(201).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

// PUT /users/:id
export const updateUser = async (req, res, next) => {
  try {
    const updates = req.body;

    if (updates.password) {
      delete updates.password; // não permite update de senha por aqui
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
      context: "query",
    }).select("-password");

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// DELETE /users/:id
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};
