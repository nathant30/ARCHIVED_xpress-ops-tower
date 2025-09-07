# Vehicle Management API Documentation
## Xpress Ops Tower Platform - Philippines Operations

### Overview
The Vehicle Management API provides comprehensive vehicle lifecycle management for the Xpress ridesharing platform in the Philippines. It supports 4 ownership models (Xpress, Fleet, Operator, Driver-owned) with differentiated data access and RBAC-enforced security.

### Base URL
```
https://api.xpressops.ph/api/vehicles
```

### Authentication
All endpoints require JWT Bearer token authentication with appropriate RBAC permissions.

```http
Authorization: Bearer <jwt_token>
```

### API Versioning
All endpoints support versioning through headers:
```http
API-Version: v1
```

---

## Table of Contents

1. [Vehicle CRUD Operations](#vehicle-crud-operations)
2. [Driver Assignment Management](#driver-assignment-management)
3. [Maintenance & Service](#maintenance--service)
4. [Real-time Telematics](#real-time-telematics)
5. [Compliance & Reporting](#compliance--reporting)
6. [Analytics & Performance](#analytics--performance)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Webhooks](#webhooks)

---

## Vehicle CRUD Operations

### List Vehicles
```http
GET /api/vehicles
```

**Query Parameters:**
- `ownershipType` (string): Filter by ownership type
- `status` (string): Filter by vehicle status
- `regionId` (string): Filter by region
- `category` (string): Filter by vehicle category
- `search` (string): Search by vehicle code, license plate, or make
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 10, max: 100)
- `sortBy` (string): Sort field
- `sortOrder` (string): 'asc' or 'desc'

**Required Permissions:** `view_vehicles`

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "veh-001",
      "vehicleCode": "XOT-001",
      "licensePlate": "ABC123",
      "make": "Toyota",
      "model": "Vios",
      "year": 2020,
      "ownershipType": "xpress_owned",
      "status": "active",
      "regionId": "region-manila",
      "totalTrips": 850,
      "utilizationRate": 75.0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15
  }
}
```

### Get Vehicle Details
```http
GET /api/vehicles/{id}
```

**Path Parameters:**
- `id` (string): Vehicle ID

**Required Permissions:** `view_vehicles`

**Example Response:**
```json
{
  "success": true,
  "data": {
    "vehicle": {
      "id": "veh-001",
      "vehicleCode": "XOT-001",
      "licensePlate": "ABC123",
      "make": "Toyota",
      "model": "Vios",
      "year": 2020,
      "ownershipType": "xpress_owned",
      "status": "active",
      "conditionRating": "good",
      "conditionScore": 85.0,
      "regionId": "region-manila",
      "obdDeviceInstalled": true,
      "currentAssignment": {
        "driverId": "driver-001",
        "driverName": "Juan Cruz",
        "assignmentType": "primary",
        "validFrom": "2024-11-01T00:00:00Z"
      },
      "complianceStatus": {
        "overallStatus": "compliant",
        "franchiseExpiry": "2025-06-30T00:00:00Z",
        "registrationExpiry": "2025-12-31T00:00:00Z"
      }
    }
  }
}
```

### Create Vehicle
```http
POST /api/vehicles
```

**Required Permissions:** `create_vehicles`, `manage_fleet`

**Request Body:**
```json
{
  "vehicleCode": "XOT-002",
  "licensePlate": "DEF456",
  "make": "Honda",
  "model": "City",
  "year": 2021,
  "color": "Silver",
  "category": "sedan",
  "fuelType": "gasoline",
  "seatingCapacity": 4,
  "ownershipType": "fleet_owned",
  "fleetOwnerName": "Metro Fleet Services",
  "regionId": "region-cebu",
  "serviceTypes": ["ride_4w"],
  "registrationExpiry": "2025-11-30T00:00:00Z",
  "obdDeviceInstalled": false
}
```

### Update Vehicle
```http
PUT /api/vehicles/{id}
```

**Required Permissions:** `update_vehicles`, `manage_fleet`

### Delete Vehicle
```http
DELETE /api/vehicles/{id}
```

**Required Permissions:** `delete_vehicles`, `manage_fleet`, requires MFA

---

## Driver Assignment Management

### List Vehicle Assignments
```http
GET /api/vehicles/{id}/assignments
```

**Query Parameters:**
- `active` (boolean): Only show active assignments
- `history` (boolean): Include assignment history

**Required Permissions:** `view_driver_assignments`

### Create Driver Assignment
```http
POST /api/vehicles/{id}/assignments
```

**Required Permissions:** `assign_driver`, `manage_fleet`

**Request Body:**
```json
{
  "driverId": "driver-001",
  "assignmentType": "primary",
  "validFrom": "2024-12-01T00:00:00Z",
  "validUntil": null,
  "dailyRentalFee": 500,
  "fuelResponsibility": "driver",
  "maintenanceResponsibility": "owner",
  "notes": "Primary assignment for Metro Manila operations"
}
```

### Bulk Assignment Operations
```http
POST /api/vehicles/assignments/bulk
```

**Required Permissions:** `assign_driver`, `manage_fleet`, `bulk_operations`

**Request Body:**
```json
{
  "assignments": [
    {
      "vehicleId": "veh-001",
      "driverId": "driver-001",
      "assignmentType": "primary",
      "dailyRentalFee": 500
    },
    {
      "vehicleId": "veh-002",
      "driverId": "driver-002",
      "assignmentType": "primary",
      "dailyRentalFee": 450
    }
  ]
}
```

### Get Available Resources for Bulk Assignment
```http
GET /api/vehicles/assignments/bulk/available?regions=region-manila,region-cebu
```

---

## Maintenance & Service

### List Maintenance Records
```http
GET /api/vehicles/{id}/maintenance
```

**Query Parameters:**
- `status` (string): Filter by maintenance status
- `priority` (string): Filter by priority level
- `dateFrom` (date): Start date filter
- `dateTo` (date): End date filter
- `includeStats` (boolean): Include summary statistics

**Required Permissions:** `view_vehicle_maintenance`

### Schedule Maintenance
```http
POST /api/vehicles/{id}/maintenance
```

**Required Permissions:** `schedule_maintenance`, `manage_fleet`

**Request Body:**
```json
{
  "maintenanceType": "oil_change",
  "priority": "routine",
  "scheduledDate": "2024-12-15T09:00:00Z",
  "description": "Scheduled oil change and filter replacement",
  "serviceProvider": "AutoServe Manila",
  "serviceLocation": "Makati Service Center",
  "estimatedDurationHours": 1.5,
  "estimatedCost": 2500
}
```

### Update Maintenance Record
```http
PUT /api/vehicles/{id}/maintenance/{maintenanceId}
```

**Required Permissions:** `update_vehicle_maintenance`, `manage_fleet`

### Get Maintenance Summary
```http
GET /api/vehicles/{id}/maintenance/summary
```

### Generate Maintenance Report
```http
GET /api/vehicles/{id}/maintenance/report?dateFrom=2024-01-01&dateTo=2024-12-31
```

**Required Permissions:** `view_vehicle_maintenance`, `generate_reports`

---

## Real-time Telematics

### Get Telemetry Data
```http
GET /api/vehicles/{id}/telemetry
```

**Query Parameters:**
- `startDate` (date): Start date for data range
- `endDate` (date): End date for data range
- `driverId` (string): Filter by specific driver
- `includeStats` (boolean): Include statistical summary
- `includeOBDStatus` (boolean): Include OBD device status
- `includeDiagnostics` (boolean): Include diagnostic events

**Required Permissions:** `view_vehicle_telemetry`

**Rate Limit:** 1000 requests per minute per user

### Get Live Telemetry
```http
GET /api/vehicles/{id}/telemetry/live
```

**Required Permissions:** `view_vehicle_telemetry`, `view_live_data`

**Data Classification:** Restricted

**Example Response:**
```json
{
  "success": true,
  "data": {
    "liveData": {
      "vehicleId": "veh-001",
      "location": {
        "latitude": 14.5995,
        "longitude": 120.9842
      },
      "speedKmh": 45.2,
      "engineRpm": 1850,
      "fuelLevelPercent": 75.8,
      "recordedAt": "2024-12-01T10:30:00Z"
    },
    "obdStatus": {
      "status": "connected",
      "lastConnection": "2024-12-01T10:30:00Z",
      "dataQuality": 98
    },
    "activeDiagnostics": [],
    "dataAge": 5000
  }
}
```

### Get Diagnostic Events
```http
GET /api/vehicles/{id}/telemetry/diagnostics
```

### Get Eco-Score Analysis
```http
GET /api/vehicles/{id}/telemetry/eco-score
```

**Required Permissions:** `view_vehicle_analytics`

---

## Compliance & Reporting

### Get Compliance Status
```http
GET /api/vehicles/{id}/compliance
```

**Query Parameters:**
- `includeReport` (boolean): Include detailed compliance report

**Required Permissions:** `view_vehicle_compliance`

**Example Response:**
```json
{
  "success": true,
  "data": {
    "compliance": {
      "franchiseNumber": "TNVS-MMD-2024-001",
      "franchiseExpiryDate": "2025-01-15T00:00:00Z",
      "overallComplianceStatus": "compliant",
      "complianceScore": 95.5
    },
    "complianceCheck": {
      "score": 95.5,
      "status": "compliant",
      "issues": []
    },
    "activeAlerts": []
  }
}
```

### Perform Compliance Check
```http
POST /api/vehicles/{id}/compliance/check
```

**Required Permissions:** `check_vehicle_compliance`

**Request Body:**
```json
{
  "checkTypes": ["franchise", "registration", "inspection", "insurance"],
  "generateReport": true
}
```

### Update Compliance Information
```http
PUT /api/vehicles/{id}/compliance
```

**Required Permissions:** `update_vehicle_compliance`, `manage_fleet`

### Generate Compliance Report
```http
GET /api/vehicles/{id}/compliance/report
```

**Required Permissions:** `view_vehicle_compliance`, `generate_reports`

---

## Analytics & Performance

### Fleet Analytics Overview
```http
GET /api/vehicles/analytics
```

**Query Parameters:**
- `type` (string): Analytics type ('overview', 'performance', 'utilization', 'cost', 'environmental')
- `region` (string): Filter by region
- `startDate` (date): Start date for analysis
- `endDate` (date): End date for analysis

**Required Permissions:** `view_vehicle_analytics`

**Rate Limit:** 20 requests per minute per user

**Example Response:**
```json
{
  "success": true,
  "data": {
    "analyticsType": "overview",
    "data": {
      "fleetOverview": {
        "totalVehicles": 150,
        "activeVehicles": 142,
        "averageUtilization": 74.2,
        "totalRevenue": 11562000
      },
      "ownershipAnalysis": {
        "breakdown": [
          {
            "type": "xpress_owned",
            "count": 45,
            "percentage": 30,
            "avgUtilization": 82.5
          }
        ]
      }
    }
  }
}
```

### Generate Custom Analytics Report
```http
POST /api/vehicles/analytics/report
```

**Required Permissions:** `view_vehicle_analytics`, `generate_reports`

**Request Body:**
```json
{
  "reportType": "performance",
  "dateRange": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-12-31T23:59:59Z"
  },
  "vehicleIds": ["veh-001", "veh-002"],
  "format": "json",
  "includeCharts": false
}
```

### Get Top Performers
```http
GET /api/vehicles/analytics/top-performers
```

**Query Parameters:**
- `metric` (string): Performance metric ('utilization', 'revenue', 'efficiency', 'trips', 'rating')
- `limit` (number): Number of results (max: 50)
- `region` (string): Filter by region

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VEHICLE_NOT_FOUND",
    "message": "Vehicle not found",
    "details": {
      "vehicleId": "veh-999"
    }
  },
  "timestamp": "2024-12-01T10:30:00Z",
  "requestId": "req_1701423000_abc123",
  "path": "/api/vehicles/veh-999",
  "method": "GET"
}
```

### Common Error Codes
- `VEHICLE_NOT_FOUND` (404): Vehicle does not exist
- `INVALID_OWNERSHIP_TYPE` (400): Invalid ownership type provided
- `DUPLICATE_VEHICLE_CODE` (409): Vehicle code already exists
- `DUPLICATE_LICENSE_PLATE` (409): License plate already exists
- `VEHICLE_IN_SERVICE` (409): Cannot perform operation on vehicle in service
- `EXISTING_PRIMARY_ASSIGNMENT` (409): Vehicle already has primary driver
- `DRIVER_ALREADY_ASSIGNED` (409): Driver already has primary assignment
- `RATE_LIMIT_EXCEEDED` (429): API rate limit exceeded
- `INSUFFICIENT_PERMISSIONS` (403): User lacks required permissions
- `INVALID_DATE_RANGE` (400): Invalid or illogical date range
- `MAINTENANCE_IN_PROGRESS` (409): Cannot modify maintenance in progress

### Validation Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "errors": [
        {
          "field": "year",
          "message": "Year must be between 1990 and 2026",
          "code": "INVALID_YEAR_RANGE"
        }
      ]
    }
  }
}
```

---

## Rate Limiting

Different endpoint categories have different rate limits:

| Category | Limit | Window | Scope |
|----------|-------|---------|--------|
| CRUD Operations | 100 requests | 1 minute | Per user + IP |
| Telemetry | 1000 requests | 1 minute | Per user + IP |
| Analytics | 20 requests | 1 minute | Per user + IP |
| Bulk Operations | 5 requests | 1 minute | Per user + IP |
| Reports | 10 requests | 1 minute | Per user + IP |

### Rate Limit Headers
All responses include rate limiting information:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701423060
```

---

## Performance & Caching

### Response Caching
Different endpoint types have different cache durations:

- Vehicle lists: 5 minutes
- Vehicle details: 10 minutes
- Analytics data: 30 minutes
- Telemetry data: 30 seconds
- Compliance data: 15 minutes
- Maintenance data: 10 minutes

### Cache Headers
```http
Cache-Control: private, max-age=300
ETag: "abc123def456"
Last-Modified: Mon, 01 Dec 2024 10:30:00 GMT
```

### Performance Monitoring
API performance is continuously monitored. Slow requests (>2s) are automatically logged and investigated.

---

## Security

### Data Classification
- **Internal**: Standard vehicle operational data
- **Restricted**: Live telemetry data, sensitive performance metrics
- **Confidential**: Financial data (Xpress-owned vehicles only)

### Regional Access Control
Users are restricted to vehicles in their assigned regions unless they have global access permissions.

### Audit Logging
All API operations are logged with:
- User ID and IP address
- Timestamp and duration
- Resource accessed
- Action performed
- Success/failure status

---

## Webhooks (Future Release)

Webhook endpoints will be available for real-time notifications:

- Vehicle status changes
- Maintenance alerts
- Compliance violations
- Assignment changes
- Diagnostic events

### Webhook Example
```json
{
  "event": "vehicle.status.changed",
  "timestamp": "2024-12-01T10:30:00Z",
  "data": {
    "vehicleId": "veh-001",
    "previousStatus": "active",
    "newStatus": "maintenance",
    "reason": "Scheduled maintenance"
  }
}
```

---

## SDK and Client Libraries

Official client libraries will be available for:
- JavaScript/TypeScript
- Python
- Java
- C#
- PHP

### JavaScript Example
```javascript
import { XpressVehicleAPI } from '@xpress/vehicle-api';

const client = new XpressVehicleAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.xpressops.ph'
});

// Get vehicle details
const vehicle = await client.vehicles.get('veh-001');

// List vehicles with filters
const vehicles = await client.vehicles.list({
  ownershipType: 'xpress_owned',
  region: 'region-manila',
  status: 'active'
});

// Create maintenance record
const maintenance = await client.vehicles.maintenance.create('veh-001', {
  maintenanceType: 'oil_change',
  priority: 'routine',
  scheduledDate: '2024-12-15T09:00:00Z',
  description: 'Routine oil change'
});
```

---

## Support

For API support and documentation:
- Email: api-support@xpressops.ph
- Documentation: https://docs.xpressops.ph/vehicle-api
- Status Page: https://status.xpressops.ph

### SLA
- 99.9% uptime guarantee
- <200ms average response time
- 24/7 monitoring and support