import { z } from "zod";
import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { writeFileSync, mkdirSync } from "fs";

const registry = new OpenAPIRegistry();

/** Example endpoint — swap to real schemas later */
const FraudAnalyzeBody = z.object({
  requestId: z.string(),
  modalities: z.object({
    location: z.object({
      lat: z.number(),
      lon: z.number(),
      timestamp: z.string()
    }).optional(),
    transaction: z.object({
      amount: z.number(),
      currency: z.string(),
      method: z.string()
    }).optional()
  })
});

const FraudAnalyzeResponse = z.object({
  requestId: z.string(),
  riskScore: z.number().min(0).max(1),
  reasons: z.array(z.string())
});

const ErrorResponse = z.object({
  error: z.string(),
  code: z.string().optional()
});

registry.registerPath({
  method: "post",
  path: "/api/v1/fraud/analyze",
  tags: ["Fraud"],
  summary: "Analyze a request and return a fraud risk score",
  operationId: "fraudAnalyze",
  request: {
    body: {
      content: { "application/json": { schema: FraudAnalyzeBody } }
    }
  },
  responses: {
    200: {
      description: "Fraud score",
      content: { "application/json": { schema: FraudAnalyzeResponse } }
    },
    400: {
      description: "Bad request",
      content: { "application/json": { schema: ErrorResponse } }
    }
  },
  security: [{ ApiKeyAuth: [] }]
});

const generator = new OpenApiGeneratorV31(registry.definitions);
const doc: any = generator.generateDocument({
  openapi: "3.1.0",
  info: {
    title: "Xpress Platform API",
    version: "1.0.0",
    license: { name: "MIT" }
  },
  servers: [{ url: "https://api.xpress.local" }]
});

// Add a simple API key security scheme and apply globally
doc.components = doc.components ?? {};
doc.components.securitySchemes = {
  ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" }
};
doc.security = [{ ApiKeyAuth: [] }];

mkdirSync("artifacts", { recursive: true });
writeFileSync("artifacts/openapi.json", JSON.stringify(doc, null, 2));
console.log("✓ Generated artifacts/openapi.json");
