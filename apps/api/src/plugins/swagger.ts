import fp from "fastify-plugin";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import {
  jsonSchemaTransform,
  jsonSchemaTransformObject,
} from "fastify-type-provider-zod";

export const swaggerPlugin = fp(async (app) => {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "OdontoArte API",
        description:
          "API do sistema de gestão do laboratório OdontoArte. Fonte de verdade dos tipos consumidos pelo frontend via Kubb.",
        version: "0.1.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    transform: jsonSchemaTransform,
    transformObject: jsonSchemaTransformObject,
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
  });
});
