# Xpress Ops Tower - Operators Management Database Schema

## Overview

The Operators Management system is a comprehensive database schema designed to manage three types of transport operators in the Philippine ridesharing ecosystem: TNVS (Transport Network Vehicle Service), General, and Fleet operators. The system implements performance-based commission tiers, financial tracking, and comprehensive fleet management capabilities.

## Architecture Overview

### System Requirements Implemented

1. **Three Operator Types**:
   - TNVS: Maximum 3 vehicles
   - General: Maximum 10 vehicles  
   - Fleet: Unlimited vehicles

2. **Performance Scoring System**: 100-point scale with four categories:
   - Vehicle Utilization (30 points)
   - Driver Management (25 points)
   - Compliance & Safety (25 points)
   - Platform Contribution (20 points)

3. **Commission Tier System**: Performance-based rates:
   - Tier 1 (1%): 70-79 score, 6+ months, 90%+ payment consistency
   - Tier 2 (2%): 80-89 score, 12+ months, top 50% utilization
   - Tier 3 (3%): 90+ score, 18+ months, top 25% metrics

4. **Financial Management**: 
   - Commission tracking and calculation
   - Daily boundary fee collection
   - Performance-based incentives and penalties
   - Comprehensive payout management

## Database Migrations Overview

| Migration | File | Purpose |
|-----------|------|---------|
| 045 | `045_operators_management_core.sql` | Core operator tables, locations, fleet management |
| 046 | `046_performance_scoring_system.sql` | Performance metrics and scoring calculations |
| 047 | `047_financial_tracking_system.sql` | Financial transactions, commissions, payouts |
| 048 | `048_operator_functions_calculations.sql` | Business logic functions for scoring and calculations |
| 049 | `049_operator_triggers_audit.sql` | Audit trails and automated business rules |
| 050 | `050_operator_management_views.sql` | Pre-built views for dashboards and reporting |
| 051 | `051_operator_seed_data.sql` | Sample data for development and testing |

## Core Tables

### 1. Operators (`operators`)

**Purpose**: Main operator registry with business information and current status.

**Key Features**:
- Supports three operator types with appropriate vehicle limits
- Tracks performance scores and commission tiers
- Maintains current financial balances
- Links to user accounts for login access

**Important Fields**:
```sql
operator_code VARCHAR(20)           -- Unique identifier (TNVS001, GEN042, FLT015)
operator_type operator_type         -- 'tnvs', 'general', 'fleet'
max_vehicles INTEGER                -- Type-based limits enforced
current_vehicle_count INTEGER       -- Auto-updated via triggers
performance_score DECIMAL(5,2)     -- 0-100 calculated score
commission_tier commission_tier     -- 'tier_1', 'tier_2', 'tier_3'
```

### 2. Operator Locations (`operator_locations`)

**Purpose**: Multi-location support for larger operators.

**Key Features**:
- Headquarters, branch offices, garages, terminals
- Geospatial coverage areas
- Location-specific capacity and operations

### 3. Operator Drivers (`operator_drivers`)

**Purpose**: Fleet management linking operators to drivers.

**Key Features**:
- Employment relationships (employed, contracted, partner)
- Performance tracking within operator context
- Contract management with start/end dates
- Location assignments for multi-location operators

### 4. Operator Vehicles (`operator_vehicles`)

**Purpose**: Vehicle fleet management and compliance tracking.

**Key Features**:
- Vehicle registration and compliance documents
- Maintenance and inspection scheduling
- Service type and capacity tracking
- Financial information (acquisition cost, depreciation)

## Performance Scoring System

### Scoring Categories

#### 1. Vehicle Utilization (30 points max)
- **Daily Utilization Rate** (12 points): Percentage of vehicles active daily
- **Peak Hour Availability** (9 points): Availability during high-demand periods
- **Fleet Efficiency Ratio** (9 points): Revenue per vehicle vs. market average

#### 2. Driver Management (25 points max)
- **Driver Retention Rate** (8.75 points): 12-month retention percentage
- **Average Driver Performance** (8.75 points): Weighted average of driver scores
- **Training Completion Rate** (7.5 points): Certification completion percentage

#### 3. Compliance & Safety (25 points max)
- **Safety Incident Rate** (10 points): Incidents per 1000 trips (inverted score)
- **Regulatory Compliance** (8.75 points): LTO/LTFRB/local regulation compliance
- **Vehicle Maintenance Score** (6.25 points): Timely maintenance compliance

#### 4. Platform Contribution (20 points max)
- **Customer Satisfaction** (8 points): Average customer rating
- **Service Area Coverage** (6 points): Geographic coverage percentage
- **Technology Adoption** (6 points): Platform feature utilization

### Performance Functions

Key calculation functions:

```sql
-- Calculate complete performance score
SELECT * FROM calculate_operator_performance_score(operator_id, scoring_date);

-- Determine commission tier eligibility
SELECT determine_commission_tier(operator_id, evaluation_date);

-- Update commission tier based on performance
SELECT update_operator_commission_tier(operator_id, evaluation_date);
```

## Financial Tracking System

### Commission Calculation

**Automatic Processing**: Triggers automatically calculate commissions when bookings are completed.

**Commission Rates**:
- Tier 1: 1% of trip fare
- Tier 2: 2% of trip fare  
- Tier 3: 3% of trip fare

### Boundary Fee System

**Daily Collection**: Operators collect boundary fees from drivers with performance adjustments.

**Fee Structure**:
```sql
Base Boundary Fee:     ₱500.00
Fuel Subsidy:         ₱50.00
Maintenance Allowance: ₱25.00
Performance Bonus:     ₱0-50.00 (score ≥85)
Performance Penalty:   ₱0-100.00 (score <60)
```

### Financial Tables

1. **`operator_financial_transactions`**: All financial transactions
2. **`operator_boundary_fees`**: Daily boundary fee collection
3. **`operator_financial_summaries`**: Period-based financial analytics
4. **`operator_payouts`**: Payout processing and settlement
5. **`operator_financial_audit`**: Complete audit trail

## Integration Points

### Integration with Existing System

#### 1. User Management Integration
```sql
-- Links operators to user accounts
operators.user_id → users.id
operators.assigned_account_manager → users.id

-- Regional access control
operators.allowed_regions → regions.id[]
```

#### 2. Driver Management Integration
```sql
-- Fleet management
operator_drivers.driver_id → drivers.id
operator_vehicles.assigned_driver_id → drivers.id

-- Performance sync via triggers
```

#### 3. Booking System Integration
```sql
-- Commission calculation
bookings.driver_id → operator_drivers.driver_id
bookings.completed → auto_process_commission_calculation()

-- Regional operations
bookings.region_id → operators.allowed_regions
```

#### 4. Location Tracking Integration
```sql
-- Real-time fleet status
driver_locations.driver_id → operator_drivers.driver_id
```

### API Integration Points

#### Performance Scoring
```
POST /api/operators/{id}/calculate-performance
GET  /api/operators/{id}/performance-history
PUT  /api/operators/{id}/performance-score
```

#### Financial Management  
```
GET  /api/operators/{id}/financial-summary
POST /api/operators/{id}/boundary-fees
GET  /api/operators/{id}/transactions
POST /api/operators/{id}/payouts
```

#### Fleet Management
```
GET  /api/operators/{id}/fleet-status
GET  /api/operators/{id}/drivers
GET  /api/operators/{id}/vehicles
POST /api/operators/{id}/vehicles/{vehicleId}/assign-driver
```

## Business Rules and Constraints

### Vehicle Limits
- TNVS operators: Maximum 3 vehicles (enforced by trigger)
- General operators: Maximum 10 vehicles (enforced by trigger)
- Fleet operators: Unlimited vehicles

### Performance Requirements
- Minimum 6 months partnership for any commission tier
- Payment consistency tracking for tier qualification
- Automated improvement plans for operators scoring <70

### Financial Rules
- Commission calculated only on completed bookings
- Boundary fees processed when drivers go offline
- Performance bonuses applied automatically based on scores
- Tier changes trigger audit log entries

## Security and Audit

### Audit Logging
All changes tracked in `operator_financial_audit`:
- Transaction creation and status changes  
- Performance score updates
- Commission tier changes
- User actions with IP addresses and session context

### Data Security
- Sensitive financial data with decimal precision
- Transaction references prevent duplicates
- Immutable audit trail
- User-based access controls

## Performance Optimization

### Indexing Strategy
- Operator lookups: `operator_code`, `status`, `region`
- Financial queries: `transaction_date`, `operator_id`, `payment_status`
- Performance queries: `scoring_period`, `total_score`, `tier`
- Fleet management: `driver_id`, `vehicle_id`, `assignment_status`

### Query Optimization
- Pre-built views for common dashboard queries
- Partitioning considerations for large transaction volumes
- Efficient geospatial indexing for location-based queries

## Views for Application Development

### Dashboard Views
- `v_operators_overview`: Complete operator information
- `v_operator_performance_dashboard`: Performance metrics and rankings  
- `v_operator_financial_overview`: Financial status and commission details
- `v_operator_fleet_status`: Real-time fleet availability

### Management Views
- `v_operator_fleet_details`: Detailed driver and vehicle assignments
- `v_operator_improvement_tracking`: Performance improvement plan progress
- `v_boundary_fees_tracking`: Boundary fee collection with performance breakdown
- `v_operator_performance_analytics`: Performance analytics with peer comparison

## Maintenance and Operations

### Daily Maintenance Tasks
Execute `run_daily_operator_maintenance()` to:
- Calculate performance scores for all operators
- Update commission tiers based on new scores  
- Clean up expired incentives and data
- Generate daily financial summaries

### Weekly Maintenance Tasks
Execute `run_weekly_operator_maintenance()` to:
- Create improvement plans for underperforming operators
- Generate performance trend reports
- Review tier qualification status

### Monitoring Alerts
- Vehicle limit violations
- Payment consistency drops below 90%
- Performance scores drop below 60
- Maintenance due dates approaching
- High-priority improvement plans at risk

## Sample Usage

### Creating a New TNVS Operator
```sql
INSERT INTO operators (
    operator_code, business_name, operator_type, 
    primary_region_id, max_vehicles, partnership_start_date
) VALUES (
    'TNVS004', 'Sample Transport Co.', 'tnvs',
    (SELECT id FROM regions WHERE code = 'MM01'), 3, CURRENT_DATE
);
```

### Calculating Performance Score
```sql
-- Calculate current performance
SELECT * FROM calculate_operator_performance_score('operator-uuid', CURRENT_DATE);

-- Batch process all operators
SELECT batch_calculate_performance_scores();
```

### Processing Boundary Fees
```sql
-- Process specific operator-driver boundary fee
SELECT process_boundary_fee_calculation(
    'operator-uuid', 'driver-uuid', CURRENT_DATE, 'ABC-1234'
);
```

### Checking Commission Tier Eligibility
```sql
-- Check if operator qualifies for tier upgrade
SELECT determine_commission_tier('operator-uuid', CURRENT_DATE);

-- Update tier if qualified
SELECT update_operator_commission_tier('operator-uuid', CURRENT_DATE);
```

## Data Migration Considerations

When migrating existing operator data:

1. **Operator Classification**: Map existing operators to TNVS/General/Fleet types
2. **Vehicle Assignments**: Ensure vehicle counts respect type limits
3. **Historical Performance**: Backfill performance scores if data available
4. **Financial History**: Import existing commission and payment data
5. **User Accounts**: Link operators to existing user accounts

## Future Enhancements

### Planned Features
1. **Advanced Analytics**: ML-based performance predictions
2. **Dynamic Pricing**: Performance-based commission adjustments
3. **Automated Compliance**: Integration with government APIs
4. **Mobile Operator App**: Direct operator management interface
5. **Integration APIs**: Third-party fleet management system connections

### Scalability Considerations
1. **Horizontal Partitioning**: Transaction tables by date/region
2. **Read Replicas**: Separate reporting database
3. **Caching Layer**: Redis for frequently accessed operator data
4. **Event Streaming**: Real-time performance updates via Kafka

## Support and Contact

For technical questions about the Operators Management schema:
- **Database Team**: database-team@xpressops.ph  
- **API Integration**: api-support@xpressops.ph
- **Documentation**: docs@xpressops.ph

---

**Note**: This schema is designed for the Philippine transport network vehicle service (TNVS) regulatory environment and may require adjustments for other jurisdictions.