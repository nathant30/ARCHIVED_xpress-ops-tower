#!/usr/bin/env node
import fs from "node:fs";

const SPEC = "docs/api/openapi.json";
if (!fs.existsSync(SPEC)) {
  console.error("OpenAPI not found at docs/api/openapi.json");
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(SPEC, "utf8"));

// Real schema definitions based on codebase types
const hardenedSchemas = {
  "Driver": {
    type: "object",
    required: ["id", "name", "email", "phone", "status", "rating", "createdAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      email: { type: "string", format: "email" },
      phone: { type: "string", pattern: "^\\+63[0-9]{10}$" },
      status: { type: "string", enum: ["active", "inactive", "suspended"] },
      rating: { type: "number", minimum: 0, maximum: 5 },
      createdAt: { type: "string", format: "date-time" },
      vehicleInfo: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["motorcycle", "car", "suv", "taxi"] },
          model: { type: "string" },
          plateNumber: { type: "string", pattern: "^[A-Z]{3}[0-9]{4}$|^[A-Z]{2}[0-9]{5}$" },
          color: { type: "string" },
          year: { type: "integer", minimum: 1900, maximum: 2030 }
        }
      },
      location: {
        type: "object",
        properties: {
          latitude: { type: "number", minimum: -90, maximum: 90 },
          longitude: { type: "number", minimum: -180, maximum: 180 },
          address: { type: "string" }
        }
      }
    }
  },
  
  "RideRequest": {
    type: "object",
    required: ["pickup", "destination", "serviceType"],
    properties: {
      pickup: {
        type: "object",
        required: ["lat", "lng", "address"],
        properties: {
          lat: { type: "number", minimum: -90, maximum: 90 },
          lng: { type: "number", minimum: -180, maximum: 180 },
          address: { type: "string" }
        }
      },
      destination: {
        type: "object", 
        required: ["lat", "lng", "address"],
        properties: {
          lat: { type: "number", minimum: -90, maximum: 90 },
          lng: { type: "number", minimum: -180, maximum: 180 },
          address: { type: "string" }
        }
      },
      serviceType: { 
        type: "string", 
        enum: ["standard", "premium", "shared", "ride_4w", "ride_2w", "send_delivery"] 
      },
      scheduledTime: { type: "string", format: "date-time" },
      passengerCount: { type: "integer", minimum: 1, maximum: 8 },
      specialRequests: { type: "string" }
    }
  },

  "RideResponse": {
    type: "object",
    required: ["rideId", "status"],
    properties: {
      rideId: { type: "string", format: "uuid" },
      bookingReference: { type: "string" },
      estimatedFare: { type: "number", minimum: 0 },
      estimatedArrival: { type: "string", format: "date-time" },
      status: { 
        type: "string", 
        enum: ["pending", "searching", "matched", "assigned", "en_route", "arrived", "in_progress", "completed", "cancelled"] 
      },
      driver: { $ref: "#/components/schemas/Driver" },
      surgeMultiplier: { type: "number", minimum: 1.0 }
    }
  },

  "RegionAssignmentRequest": {
    type: "object",
    required: ["userId"],
    properties: {
      userId: { type: "string", format: "uuid" },
      startDate: { type: "string", format: "date" },
      endDate: { type: "string", format: "date" },
      role: { type: "string", enum: ["regional_manager", "supervisor", "operator"] },
      permissions: {
        type: "array",
        items: { type: "string" }
      }
    }
  },

  "RegionAssignmentResponse": {
    type: "object",
    required: ["success", "assignment"],
    properties: {
      success: { type: "boolean" },
      message: { type: "string" },
      assignment: {
        type: "object",
        required: ["regionId", "userId", "assignedAt"],
        properties: {
          regionId: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          assignedAt: { type: "string", format: "date-time" },
          role: { type: "string" },
          permissions: { type: "array", items: { type: "string" } }
        }
      }
    }
  },

  "DriversListResponse": {
    type: "object",
    required: ["data", "pagination"],
    properties: {
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/Driver" }
      },
      pagination: { $ref: "#/components/schemas/Pagination" },
      totalActive: { type: "integer" },
      totalInactive: { type: "integer" },
      averageRating: { type: "number", minimum: 0, maximum: 5 }
    }
  },

  "DriverUpdateRequest": {
    type: "object",
    properties: {
      status: { type: "string", enum: ["active", "inactive", "suspended"] },
      phone: { type: "string", pattern: "^\\+63[0-9]{10}$" },
      email: { type: "string", format: "email" },
      vehicleInfo: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["motorcycle", "car", "suv", "taxi"] },
          model: { type: "string" },
          plateNumber: { type: "string" },
          color: { type: "string" }
        }
      }
    }
  }
};

// Replace generic schemas with hardened ones
Object.assign(spec.components.schemas, hardenedSchemas);

// Update endpoint schemas to use real types
const endpointSchemaMap = {
  // GET /api/drivers
  "DriversGETResponse": "DriversListResponse",
  
  // PATCH /api/drivers/{id}  
  "DriversPATCHRequest": "DriverUpdateRequest",
  "DriversPATCHResponse": "Driver",
  
  // POST /api/regions/{id}/assign-rm
  "RegionsAssignRmPOSTRequest": "RegionAssignmentRequest", 
  "RegionsAssignRmPOSTResponse": "RegionAssignmentResponse",
  
  // POST /api/rides/request
  "RidesRequestPOSTRequest": "RideRequest",
  "RidesRequestPOSTResponse": "RideResponse"
};

// Remove generic stub schemas and redirect references
Object.keys(endpointSchemaMap).forEach(oldSchema => {
  const newSchema = endpointSchemaMap[oldSchema];
  
  // Remove old generic schema
  if (spec.components.schemas[oldSchema]) {
    delete spec.components.schemas[oldSchema];
  }
  
  // Update all $ref references
  const specStr = JSON.stringify(spec);
  const updatedSpecStr = specStr.replace(
    new RegExp(`"#/components/schemas/${oldSchema}"`, 'g'),
    `"#/components/schemas/${newSchema}"`
  );
  Object.assign(spec, JSON.parse(updatedSpecStr));
});

fs.writeFileSync(SPEC, JSON.stringify(spec, null, 2));
console.log("✅ Hardened OpenAPI schemas with real type definitions");