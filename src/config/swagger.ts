import { Options } from "swagger-jsdoc";

export const swaggerOptions: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ghost Backend API",
      version: "1.0.0",
      description: "Auto-generated Swagger docs",
    },
  },
  // Path to the API docs
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};
