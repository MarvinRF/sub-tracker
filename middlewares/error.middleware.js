const errorMiddleware = (err, req, res, next) => {
  try {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Server Error";

    // Log sanitizado
    console.error({
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });

    // Mongoose bad ObjectId
    if (err.name === "CastError") {
      message = `Resource not found. Invalid ${err.path}`;
      statusCode = 404;
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
      message = "Duplicate field value entered";
      statusCode = 400;
    }

    // Mongoose Validation error
    if (err.name === "ValidationError") {
      message = Object.values(err.errors)
        .map((val) => val.message)
        .join(", ");
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  } catch (internalError) {
    // Se algo der errado aqui, encaminha para o próximo middleware de erro
    next(internalError);
  }
};

export default errorMiddleware;
