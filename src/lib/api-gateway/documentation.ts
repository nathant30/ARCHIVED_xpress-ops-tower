// API Documentation Generator & Management System
// Automatically generates comprehensive API documentation with examples, schemas, and interactive testing

import { z } from 'zod';
import yaml from 'js-yaml';

// OpenAPI 3.0 Types
export interface ApiDocumentation {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    termsOfService?: string;
    contact?: {
      name: string;
      url?: string;
      email: string;
    };
    license?: {
      name: string;
      url?: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, PathItem>;
  components: {
    schemas: Record<string, Schema>;
    securitySchemes: Record<string, SecurityScheme>;
    parameters: Record<string, Parameter>;
    responses: Record<string, Response>;
    examples: Record<string, Example>;
  };
  security: SecurityRequirement[];
  tags: Tag[];
  externalDocs?: {
    description: string;
    url: string;
  };
}

export interface PathItem {
  summary?: string;
  description?: string;
  get?: Operation;
  post?: Operation;
  put?: Operation;
  patch?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  parameters?: Parameter[];
}

export interface Operation {
  tags?: string[];
  summary: string;
  description?: string;
  operationId: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  security?: SecurityRequirement[];
  deprecated?: boolean;
  examples?: Record<string, Example>;
}

export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  schema: Schema;
  example?: any;
  examples?: Record<string, Example>;
}

export interface RequestBody {
  description?: string;
  content: Record<string, MediaType>;
  required?: boolean;
}

export interface Response {
  description: string;
  headers?: Record<string, Header>;
  content?: Record<string, MediaType>;
}

export interface MediaType {
  schema?: Schema;
  example?: any;
  examples?: Record<string, Example>;
}

export interface Header {
  description?: string;
  required?: boolean;
  schema: Schema;
}

export interface Schema {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  required?: string[];
  enum?: any[];
  example?: any;
  default?: any;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  $ref?: string;
}

export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlows;
  openIdConnectUrl?: string;
}

export interface OAuthFlows {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
}

export interface OAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface SecurityRequirement {
  [name: string]: string[];
}

export interface Tag {
  name: string;
  description?: string;
  externalDocs?: {
    description: string;
    url: string;
  };
}

export interface Example {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

// API Endpoint Metadata
export interface EndpointMetadata {
  path: string;
  method: string;
  summary: string;
  description?: string;
  tags: string[];
  parameters: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  security?: SecurityRequirement[];
  examples: {
    request?: any;
    responses: Record<string, any>;
  };
  rateLimits?: {
    requests: number;
    window: string;
  };
  permissions?: string[];
  deprecated?: boolean;
  version?: string;
}

export class ApiDocumentationGenerator {
  private endpoints: Map<string, EndpointMetadata> = new Map();
  private schemas: Map<string, Schema> = new Map();
  private info: ApiDocumentation['info'];
  private servers: ApiDocumentation['servers'];

  constructor(info: ApiDocumentation['info'], servers: ApiDocumentation['servers']) {
    this.info = info;
    this.servers = servers;
    this.initializeCommonSchemas();
  }

  /**
   * Register an API endpoint with its metadata
   */
  registerEndpoint(metadata: EndpointMetadata): void {
    const key = `${metadata.method.toUpperCase()} ${metadata.path}`;
    this.endpoints.set(key, metadata);
  }

  /**
   * Register a schema component
   */
  registerSchema(name: string, schema: Schema): void {
    this.schemas.set(name, schema);
  }

  /**
   * Generate complete OpenAPI documentation
   */
  generateDocumentation(): ApiDocumentation {
    const paths: Record<string, PathItem> = {};
    const tags = new Set<string>();

    // Process all registered endpoints
    this.endpoints.forEach((metadata, key) => {
      const pathItem = paths[metadata.path] || {};
      const operation = this.createOperation(metadata);
      
      // Add operation to path item
      pathItem[metadata.method.toLowerCase() as keyof PathItem] = operation as any;
      paths[metadata.path] = pathItem;
      
      // Collect tags
      metadata.tags.forEach(tag => tags.add(tag));
    });

    // Generate tag definitions
    const tagDefinitions: Tag[] = Array.from(tags).map(tag => ({
      name: tag,
      description: this.getTagDescription(tag),
    }));

    return {
      openapi: '3.0.3',
      info: this.info,
      servers: this.servers,
      paths,
      components: {
        schemas: Object.fromEntries(this.schemas),
        securitySchemes: this.createSecuritySchemes(),
        parameters: this.createCommonParameters(),
        responses: this.createCommonResponses(),
        examples: this.createCommonExamples(),
      },
      security: [
        { ApiKey: [] },
        { BearerAuth: [] },
      ],
      tags: tagDefinitions,
    };
  }

  /**
   * Generate documentation in different formats
   */
  exportDocumentation(format: 'json' | 'yaml'): string {
    const documentation = this.generateDocumentation();
    
    if (format === 'yaml') {
      return yaml.dump(documentation, { 
        indent: 2, 
        lineWidth: 120,
        noRefs: true 
      });
    }
    
    return JSON.stringify(documentation, null, 2);
  }

  /**
   * Generate Postman collection
   */
  generatePostmanCollection(): any {
    const collection = {
      info: {
        name: this.info.title,
        description: this.info.description,
        version: this.info.version,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      auth: {
        type: 'apikey',
        apikey: [
          { key: 'key', value: 'X-API-Key', type: 'string' },
          { key: 'value', value: '{{API_KEY}}', type: 'string' },
          { key: 'in', value: 'header', type: 'string' },
        ],
      },
      variable: [
        { key: 'baseUrl', value: this.servers[0]?.url || 'http://localhost:4000', type: 'string' },
        { key: 'API_KEY', value: 'your-api-key-here', type: 'string' },
      ],
      item: this.generatePostmanItems(),
    };

    return collection;
  }

  /**
   * Generate interactive HTML documentation
   */
  generateHtmlDocumentation(): string {
    const documentation = this.generateDocumentation();
    const openApiJson = JSON.stringify(documentation, null, 2);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.info.title} - API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin: 0;
      background: #fafafa;
    }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { font-size: 36px; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '',
        spec: ${openApiJson},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: 'StandaloneLayout',
        tryItOutEnabled: true,
        requestInterceptor: function(req) {
          // Add API key to requests
          if (!req.headers['X-API-Key']) {
            req.headers['X-API-Key'] = 'your-api-key-here';
          }
          return req;
        },
        responseInterceptor: function(res) {
          return res;
        }
      });
    };
  </script>
</body>
</html>`;
  }

  /**
   * Generate SDK code examples for different languages
   */
  generateSDKExamples(endpoint: EndpointMetadata): Record<string, string> {
    const examples: Record<string, string> = {};
    
    // JavaScript/Node.js example
    examples['javascript'] = this.generateJavaScriptExample(endpoint);
    
    // Python example
    examples['python'] = this.generatePythonExample(endpoint);
    
    // PHP example
    examples['php'] = this.generatePHPExample(endpoint);
    
    // cURL example
    examples['curl'] = this.generateCurlExample(endpoint);
    
    return examples;
  }

  /**
   * Initialize common schemas used across the API
   */
  private initializeCommonSchemas(): void {
    // Error response schema
    this.registerSchema('Error', {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'E400' },
            message: { type: 'string', example: 'Invalid request' },
            details: { type: 'object' },
          },
          required: ['code', 'message'],
        },
        timestamp: { type: 'string', format: 'date-time' },
        requestId: { type: 'string', example: 'req_1234567890_abcd' },
      },
      required: ['success', 'error', 'timestamp', 'requestId'],
    });

    // Success response schema
    this.registerSchema('Success', {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object' },
        message: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        requestId: { type: 'string', example: 'req_1234567890_abcd' },
      },
      required: ['success', 'data', 'timestamp', 'requestId'],
    });

    // Pagination schema
    this.registerSchema('Pagination', {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1, example: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, example: 20 },
        total: { type: 'integer', minimum: 0, example: 150 },
        totalPages: { type: 'integer', minimum: 0, example: 8 },
        hasNext: { type: 'boolean', example: true },
        hasPrev: { type: 'boolean', example: false },
      },
      required: ['page', 'limit', 'total', 'totalPages', 'hasNext', 'hasPrev'],
    });

    // User schema
    this.registerSchema('User', {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'user_1234567890' },
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        name: { type: 'string', example: 'John Doe' },
        role: { type: 'string', enum: ['admin', 'operator', 'viewer'], example: 'operator' },
        status: { type: 'string', enum: ['active', 'inactive', 'suspended'], example: 'active' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
      required: ['id', 'email', 'name', 'role', 'status', 'createdAt', 'updatedAt'],
    });

    // Driver schema
    this.registerSchema('Driver', {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'drv_1234567890' },
        name: { type: 'string', example: 'Juan Dela Cruz' },
        email: { type: 'string', format: 'email', example: 'juan@example.com' },
        phone: { type: 'string', example: '+639123456789' },
        licenseNumber: { type: 'string', example: 'N01-12-345678' },
        vehicleType: { type: 'string', enum: ['4_seat', '6_seat'], example: '4_seat' },
        status: { type: 'string', enum: ['active', 'inactive', 'suspended'], example: 'active' },
        location: {
          type: 'object',
          properties: {
            lat: { type: 'number', example: 14.5995 },
            lng: { type: 'number', example: 120.9842 },
            address: { type: 'string', example: 'Manila, Philippines' },
          },
        },
        rating: { type: 'number', minimum: 0, maximum: 5, example: 4.8 },
        totalTrips: { type: 'integer', minimum: 0, example: 1247 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
      required: ['id', 'name', 'email', 'phone', 'licenseNumber', 'vehicleType', 'status'],
    });

    // API Key schema
    this.registerSchema('ApiKey', {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'key_1234567890' },
        name: { type: 'string', example: 'Mobile App Production' },
        permissions: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['rides:read', 'drivers:read', 'pricing:read']
        },
        status: { type: 'string', enum: ['active', 'inactive', 'revoked'], example: 'active' },
        rateLimits: {
          type: 'object',
          properties: {
            requests: { type: 'integer', example: 1000 },
            windowMs: { type: 'integer', example: 60000 },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        expiresAt: { type: 'string', format: 'date-time', nullable: true },
      },
      required: ['id', 'name', 'permissions', 'status', 'createdAt', 'updatedAt'],
    });
  }

  /**
   * Create operation object from endpoint metadata
   */
  private createOperation(metadata: EndpointMetadata): Operation {
    return {
      tags: metadata.tags,
      summary: metadata.summary,
      description: metadata.description,
      operationId: `${metadata.method.toLowerCase()}${metadata.path.replace(/[^a-zA-Z0-9]/g, '')}`,
      parameters: metadata.parameters,
      requestBody: metadata.requestBody,
      responses: {
        ...metadata.responses,
        '401': { $ref: '#/components/responses/Unauthorized' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '429': { $ref: '#/components/responses/TooManyRequests' },
        '500': { $ref: '#/components/responses/InternalServerError' },
      },
      security: metadata.security,
      deprecated: metadata.deprecated,
    };
  }

  /**
   * Create security schemes
   */
  private createSecuritySchemes(): Record<string, SecurityScheme> {
    return {
      ApiKey: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API key for authentication. Get your key from the dashboard.',
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for user authentication.',
      },
    };
  }

  /**
   * Create common parameters
   */
  private createCommonParameters(): Record<string, Parameter> {
    return {
      Page: {
        name: 'page',
        in: 'query',
        description: 'Page number for pagination (1-based)',
        required: false,
        schema: { type: 'integer', minimum: 1, default: 1 },
        example: 1,
      },
      Limit: {
        name: 'limit',
        in: 'query',
        description: 'Number of items per page',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        example: 20,
      },
      Search: {
        name: 'search',
        in: 'query',
        description: 'Search query string',
        required: false,
        schema: { type: 'string', maxLength: 100 },
        example: 'john doe',
      },
    };
  }

  /**
   * Create common responses
   */
  private createCommonResponses(): Record<string, Response> {
    return {
      Unauthorized: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: {
                code: 'E401',
                message: 'Authentication required',
              },
              timestamp: '2024-01-15T10:30:00.000Z',
              requestId: 'req_1234567890_abcd',
            },
          },
        },
      },
      Forbidden: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: {
                code: 'E403',
                message: 'Insufficient permissions',
              },
              timestamp: '2024-01-15T10:30:00.000Z',
              requestId: 'req_1234567890_abcd',
            },
          },
        },
      },
      TooManyRequests: {
        description: 'Rate limit exceeded',
        headers: {
          'X-RateLimit-Limit': {
            schema: { type: 'integer' },
            description: 'Request limit per time window',
          },
          'X-RateLimit-Remaining': {
            schema: { type: 'integer' },
            description: 'Remaining requests in current window',
          },
          'X-RateLimit-Reset': {
            schema: { type: 'integer' },
            description: 'Unix timestamp when the rate limit resets',
          },
        },
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: {
                code: 'E429',
                message: 'Rate limit exceeded',
              },
              timestamp: '2024-01-15T10:30:00.000Z',
              requestId: 'req_1234567890_abcd',
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: {
                code: 'E500',
                message: 'Internal server error',
              },
              timestamp: '2024-01-15T10:30:00.000Z',
              requestId: 'req_1234567890_abcd',
            },
          },
        },
      },
    };
  }

  /**
   * Create common examples
   */
  private createCommonExamples(): Record<string, Example> {
    return {
      SuccessfulPagination: {
        summary: 'Successful paginated response',
        value: {
          success: true,
          data: {
            items: [
              { id: 1, name: 'Item 1' },
              { id: 2, name: 'Item 2' },
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 150,
              totalPages: 8,
              hasNext: true,
              hasPrev: false,
            },
          },
          timestamp: '2024-01-15T10:30:00.000Z',
          requestId: 'req_1234567890_abcd',
        },
      },
    };
  }

  /**
   * Get tag description
   */
  private getTagDescription(tag: string): string {
    const descriptions: Record<string, string> = {
      'Authentication': 'User authentication and authorization endpoints',
      'Users': 'User management operations',
      'Drivers': 'Driver management and tracking',
      'Rides': 'Ride booking and management',
      'Pricing': 'Dynamic pricing and fare calculation',
      'Analytics': 'Business analytics and reporting',
      'API Keys': 'API key management for developers',
      'System': 'System health and monitoring',
      'Webhooks': 'Webhook configuration and management',
    };
    
    return descriptions[tag] || `${tag} related operations`;
  }

  /**
   * Generate Postman collection items
   */
  private generatePostmanItems(): any[] {
    const items: any[] = [];
    const groupedByTag: Record<string, any[]> = {};

    // Group endpoints by tag
    this.endpoints.forEach((metadata, key) => {
      const primaryTag = metadata.tags[0] || 'Uncategorized';
      
      if (!groupedByTag[primaryTag]) {
        groupedByTag[primaryTag] = [];
      }
      
      const postmanItem = {
        name: `${metadata.method.toUpperCase()} ${metadata.path}`,
        request: {
          method: metadata.method.toUpperCase(),
          header: [
            { key: 'Content-Type', value: 'application/json', type: 'text' },
            { key: 'X-API-Key', value: '{{API_KEY}}', type: 'text' },
          ],
          url: {
            raw: `{{baseUrl}}${metadata.path}`,
            host: ['{{baseUrl}}'],
            path: metadata.path.split('/').filter(p => p),
          },
          description: metadata.description,
        },
        response: [],
      };

      // Add request body if present
      if (metadata.requestBody && metadata.examples.request) {
        postmanItem.request.body = {
          mode: 'raw',
          raw: JSON.stringify(metadata.examples.request, null, 2),
        };
      }

      groupedByTag[primaryTag].push(postmanItem);
    });

    // Create folder structure
    Object.entries(groupedByTag).forEach(([tag, tagItems]) => {
      items.push({
        name: tag,
        item: tagItems,
        description: this.getTagDescription(tag),
      });
    });

    return items;
  }

  /**
   * Generate JavaScript example
   */
  private generateJavaScriptExample(endpoint: EndpointMetadata): string {
    const hasBody = endpoint.requestBody && endpoint.examples.request;
    const bodyString = hasBody ? `,\n  body: JSON.stringify(${JSON.stringify(endpoint.examples.request, null, 2)})` : '';
    
    return `
// Using fetch API
const response = await fetch('${this.servers[0]?.url || 'http://localhost:4000'}${endpoint.path}', {
  method: '${endpoint.method.toUpperCase()}',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key-here'
  }${bodyString}
});

const data = await response.json();
console.log(data);

// Using axios
const axios = require('axios');

const { data } = await axios({
  method: '${endpoint.method.toLowerCase()}',
  url: '${this.servers[0]?.url || 'http://localhost:4000'}${endpoint.path}',
  headers: {
    'X-API-Key': 'your-api-key-here'
  }${hasBody ? `,\n  data: ${JSON.stringify(endpoint.examples.request, null, 2)}` : ''}
});

console.log(data);`.trim();
  }

  /**
   * Generate Python example
   */
  private generatePythonExample(endpoint: EndpointMetadata): string {
    const hasBody = endpoint.requestBody && endpoint.examples.request;
    const bodyString = hasBody ? `\ndata = ${JSON.stringify(endpoint.examples.request, null, 2)}\n` : '';
    const requestArgs = hasBody ? ', json=data' : '';
    
    return `
import requests

url = "${this.servers[0]?.url || 'http://localhost:4000'}${endpoint.path}"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "your-api-key-here"
}${bodyString}
response = requests.${endpoint.method.toLowerCase()}(url, headers=headers${requestArgs})
print(response.json())

# Using aiohttp (async)
import aiohttp
import asyncio

async def make_request():
    async with aiohttp.ClientSession() as session:
        async with session.${endpoint.method.toLowerCase()}(url, headers=headers${requestArgs ? ', json=data' : ''}) as response:
            result = await response.json()
            print(result)

asyncio.run(make_request())`.trim();
  }

  /**
   * Generate PHP example
   */
  private generatePHPExample(endpoint: EndpointMetadata): string {
    const hasBody = endpoint.requestBody && endpoint.examples.request;
    
    return `
<?php

$url = "${this.servers[0]?.url || 'http://localhost:4000'}${endpoint.path}";
$headers = [
    'Content-Type: application/json',
    'X-API-Key: your-api-key-here'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${endpoint.method.toUpperCase()}');
${hasBody ? `curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(${JSON.stringify(endpoint.examples.request)}));` : ''}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);
print_r($data);

// Using Guzzle HTTP client
require 'vendor/autoload.php';

use GuzzleHttp\\Client;

$client = new Client();
$response = $client->request('${endpoint.method.toUpperCase()}', $url, [
    'headers' => [
        'Content-Type' => 'application/json',
        'X-API-Key' => 'your-api-key-here'
    ]${hasBody ? `,\n    'json' => ${JSON.stringify(endpoint.examples.request)}` : ''}
]);

$data = json_decode($response->getBody(), true);
print_r($data);
?>`.trim();
  }

  /**
   * Generate cURL example
   */
  private generateCurlExample(endpoint: EndpointMetadata): string {
    const hasBody = endpoint.requestBody && endpoint.examples.request;
    const bodyOption = hasBody ? ` \\\n  --data '${JSON.stringify(endpoint.examples.request)}'` : '';
    
    return `
curl -X ${endpoint.method.toUpperCase()} "${this.servers[0]?.url || 'http://localhost:4000'}${endpoint.path}" \\
  --header "Content-Type: application/json" \\
  --header "X-API-Key: your-api-key-here"${bodyOption}`.trim();
  }
}

// Auto-discovery function to scan existing endpoints
export async function discoverApiEndpoints(routesDir: string): Promise<EndpointMetadata[]> {
  const fs = require('fs').promises;
  const path = require('path');
  const endpoints: EndpointMetadata[] = [];

  async function scanDirectory(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.isFile() && entry.name === 'route.ts') {
          // Extract endpoint metadata from route file
          const endpoint = await extractEndpointFromFile(fullPath, dir);
          if (endpoint) {
            endpoints.push(endpoint);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }
  }

  await scanDirectory(routesDir);
  return endpoints;
}

// Extract endpoint metadata from route file
async function extractEndpointFromFile(filePath: string, baseDir: string): Promise<EndpointMetadata | null> {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Extract path from file location
    const relativePath = path.relative(baseDir, path.dirname(filePath));
    const apiPath = '/api/' + relativePath.replace(/\\/g, '/');
    
    // Parse export functions to determine supported methods
    const methods = [];
    if (content.includes('export async function GET')) methods.push('GET');
    if (content.includes('export async function POST')) methods.push('POST');
    if (content.includes('export async function PUT')) methods.push('PUT');
    if (content.includes('export async function PATCH')) methods.push('PATCH');
    if (content.includes('export async function DELETE')) methods.push('DELETE');
    
    // Extract JSDoc comments for documentation
    const docComments = content.match(/\/\*\*([\s\S]*?)\*\//g) || [];
    const summary = docComments.length > 0 
      ? docComments[0].replace(/\/\*\*|\*\/|\*/g, '').trim().split('\n')[0].trim()
      : `API endpoint for ${apiPath}`;
    
    // Create basic endpoint metadata
    const endpoint: EndpointMetadata = {
      path: apiPath,
      method: methods[0] || 'GET',
      summary,
      tags: [apiPath.split('/')[2] || 'General'],
      parameters: [],
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Success' },
            },
          },
        },
      },
      examples: {
        responses: {
          '200': { success: true, data: {}, timestamp: new Date().toISOString(), requestId: 'req_example' },
        },
      },
    };
    
    return endpoint;
  } catch (error) {
    console.error(`Error extracting endpoint from ${filePath}:`, error);
    return null;
  }
}