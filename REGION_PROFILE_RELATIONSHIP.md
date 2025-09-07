# Pricing Profile Region Linking Architecture

## Overview

The **Xpress Ops Tower Pricing Center** implements a sophisticated region-profile relationship system that links pricing configurations to specific geographic regions. Here's how the system works:

## Database Schema Relationships

### Core Tables

1. **`regions`** - Master table for geographic regions
   ```sql
   regions (
     region_id TEXT PRIMARY KEY,     -- e.g., 'NCR', 'R3', 'R7'
     name TEXT NOT NULL,             -- e.g., 'National Capital Region'
     region_code TEXT,               -- Short code for region
     region_state TEXT,              -- 'active', 'inactive' 
     country_code TEXT DEFAULT 'PH', -- ISO country code
     timezone TEXT,                  -- e.g., 'Asia/Manila'
     currency_code TEXT,             -- e.g., 'PHP'
     description TEXT,               -- Region description
     geographic_bounds TEXT,         -- JSON with lat/lng bounds
     cities TEXT                     -- JSON array of cities
   )
   ```

2. **`pricing_profiles_v4`** - Pricing configurations linked to regions
   ```sql
   pricing_profiles_v4 (
     id INTEGER PRIMARY KEY,
     region_id TEXT NOT NULL,        -- FOREIGN KEY to regions.region_id
     service_key TEXT NOT NULL,      -- 'tnvs', 'taxi', 'special', etc.
     name TEXT NOT NULL,
     status TEXT DEFAULT 'draft',
     -- Pricing structure fields...
     base_fare REAL,
     per_km REAL,
     per_minute REAL,
     -- Revenue sharing fields...
     driver_commission_pct REAL,
     fleet_commission_pct REAL,
     -- Regulatory compliance...
     regulator_status TEXT,
     regulator_ref TEXT,
     -- AI optimization...
     ai_health_score REAL,
     FOREIGN KEY (region_id) REFERENCES regions(region_id)
   )
   ```

## How the Linking Works

### 1. Foreign Key Relationship
- Each pricing profile has a `region_id` field that references `regions.region_id`
- This creates a **many-to-one** relationship: many profiles can belong to one region
- Database enforces referential integrity through foreign key constraints

### 2. API Data Enrichment
The `/api/v1/pricing/profiles` endpoint automatically enriches profile data:

```typescript
// Fetch profiles with region data
const enrichedProfiles = profilesArray.map(profile => ({
  ...profile,
  region: regions.find(r => r.id === profile.regionId) || fallbackRegion
}));
```

### 3. UI Region Display
The PricingProfilesManager component shows enriched region information:

```jsx
{profile.region && (
  <div className="mb-3 p-3 bg-blue-50 rounded-lg">
    <div className="flex items-center space-x-2 mb-2">
      <MapPin className="h-4 w-4 text-blue-600" />
      <span className="font-medium text-blue-900">
        {profile.region.name} ({profile.region.code})
      </span>
    </div>
    <div className="text-sm text-blue-700 mb-1">
      <span className="font-medium">Coverage:</span> 
      {profile.region.cities.slice(0, 4).join(', ')}
      {profile.region.cities.length > 4 && ` +${profile.region.cities.length - 4} more cities`}
    </div>
    <div className="flex items-center space-x-4 text-xs text-blue-600">
      <span>{profile.region.currency} | {profile.region.timezone}</span>
      <span>{profile.region.active_profiles_count} active profiles in region</span>
    </div>
  </div>
)}
```

## Example Data Relationships

### Sample Regions
```javascript
const regions = [
  {
    id: 'NCR',
    name: 'National Capital Region',
    code: 'NCR',
    cities: ['Manila', 'Quezon City', 'Makati', 'Taguig', 'Pasig', 'Mandaluyong', 'BGC', 'Ortigas'],
    currency: 'PHP',
    timezone: 'Asia/Manila',
    active_profiles_count: 3,
    total_profiles_count: 5
  },
  {
    id: 'R7', 
    name: 'Central Visayas',
    code: 'R7',
    cities: ['Cebu City', 'Lapu-Lapu', 'Mandaue', 'Talisay', 'Dumaguete'],
    currency: 'PHP',
    timezone: 'Asia/Manila',
    active_profiles_count: 2,
    total_profiles_count: 4
  }
];
```

### Sample Profiles Linked to Regions
```javascript
const profiles = [
  {
    id: '1',
    name: 'TNVS Premium - Metro Manila',
    regionId: 'NCR',  // ← Links to NCR region
    serviceKey: 'tnvs',
    baseFare: 50.00,
    perKm: 15.00,
    status: 'active',
    regulatorRef: 'LTFRB-2024-001'
  },
  {
    id: '4',
    name: 'TNVS Island Hopper - Cebu', 
    regionId: 'R7',   // ← Links to Central Visayas region
    serviceKey: 'tnvs',
    baseFare: 38.00,
    perKm: 11.00,
    status: 'draft',
    regulatorRef: 'LTFRB-2024-004'
  }
];
```

## User Experience Features

### 1. Region Selection in Profile Creation
- Dropdown shows all available regions with context:
  ```
  National Capital Region (NCR) - 3 active profiles
  Central Luzon (R3) - 2 active profiles
  Central Visayas (R7) - 2 active profiles
  ```

### 2. Region Preview
When selecting a region during profile creation, users see:
- Region name and description
- Cities covered (first 3, with "+X more" if applicable)  
- Currency and timezone
- Current profile count in region

### 3. Enhanced Profile Display
Each profile shows:
- **Region card** with full context (name, cities, currency, timezone)
- **Profile count** in the same region
- **Geographic scope** understanding

### 4. Advanced Filtering
Users can filter profiles by:
- **Region**: Filter to see profiles for specific geographic areas
- **Status**: Active, draft, suspended profiles per region
- **Service Type**: TNVS, taxi, special hire per region

## Regional Business Logic

### 1. LTFRB Compliance
- Regulatory references are region-specific
- Approval workflows consider regional regulations
- Different regions may have different fare structures

### 2. Currency and Localization  
- Each region has its own currency (primarily PHP for Philippines)
- Timezone handling for regional operations
- Local regulatory compliance tracking

### 3. Geographic Coverage
- City-level granularity within regions
- Airport surcharges specific to regional airports
- POI (Point of Interest) surcharges for regional landmarks

## Technical Implementation

### API Endpoints
- `GET /api/v1/regions` - List all regions with profile counts
- `GET /api/v1/pricing/profiles?regionId=NCR` - Filter profiles by region
- `POST /api/v1/pricing/profiles` - Create profile with region assignment

### Data Validation
- Ensures `regionId` exists in regions table before profile creation
- Validates regional business rules (currency, regulatory requirements)
- Maintains referential integrity across region-profile relationships

### Performance Optimization  
- Region data cached for quick profile enrichment
- Efficient joins for listing profiles with region information
- Indexed queries on `region_id` for fast filtering

## Conclusion

The **region-profile relationship** is implemented through:

1. **Database**: Foreign key relationship ensuring data integrity
2. **API**: Automatic enrichment of profile data with region information  
3. **UI**: Rich display of regional context for each pricing profile
4. **Business Logic**: Region-aware pricing rules and regulatory compliance

This architecture allows the Xpress Ops Tower to manage pricing across multiple Philippine regions while maintaining clear geographic boundaries and regulatory compliance requirements.