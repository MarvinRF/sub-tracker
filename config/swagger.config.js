import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { PORT } from "./env.js";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Subscription Tracker API",
      version: "1.0.0",
      description: "API para gerenciamento de assinaturas",
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
      },
    ],
  },
  apis: ["../routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

export { setupSwagger, swaggerSpec };
