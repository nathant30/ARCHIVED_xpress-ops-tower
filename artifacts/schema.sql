CREATE TABLE tnvs_fares (
  id SERIAL PRIMARY KEY,
  profile_id INT NOT NULL REFERENCES pricing_profiles(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('4_seat','6_seat')),
  base_fare NUMERIC(10,2) NOT NULL,
  per_km NUMERIC(10,2) NOT NULL,
  per_min NUMERIC(10,2) NOT NULL,
  min_fare NUMERIC(10,2) NOT NULL,
  surge_cap NUMERIC(4,2) DEFAULT 2.0,
  currency CHAR(3) DEFAULT 'PHP',
  
  -- Elasticity and rider segmentation
  new_rider_cap NUMERIC(4,2) DEFAULT 1.5,
  loyal_rider_threshold NUMERIC(4,2) DEFAULT 2.5,
  driver_incentive_coupling BOOLEAN DEFAULT true,
  
  UNIQUE(profile_id, vehicle_type)
);
CREATE TABLE taxi_fares (
  id SERIAL PRIMARY KEY,
  profile_id INT NOT NULL REFERENCES pricing_profiles(id) ON DELETE CASCADE,
  flagdown NUMERIC(10,2) NOT NULL,
  per_km NUMERIC(10,2) NOT NULL,
  per_min NUMERIC(10,2) NOT NULL,
  
  -- Surcharges
  night_surcharge_pct NUMERIC(5,2) DEFAULT 0,
  airport_surcharge NUMERIC(10,2) DEFAULT 0,
  event_surcharge NUMERIC(10,2) DEFAULT 0,
  holiday_surcharge NUMERIC(10,2) DEFAULT 0,
  
  -- Xpress booking fees
  xpress_booking_fee_flat NUMERIC(10,2) DEFAULT 69.00,
  xpress_booking_fee_pct NUMERIC(5,2) DEFAULT 0,
  
  -- Compliance settings
  ltfrb_compliant BOOLEAN DEFAULT true,
  surge_blocked BOOLEAN DEFAULT true,
  
  other_surcharges JSONB DEFAULT '{}',
  UNIQUE(profile_id)
);
CREATE TABLE special_region_fares (
  id SERIAL PRIMARY KEY,
  profile_id INT NOT NULL REFERENCES pricing_profiles(id) ON DELETE CASCADE,
  zone_id INT REFERENCES zones(id),
  region_name TEXT NOT NULL, -- 'Boracay', 'El Nido', etc.
  
  fare_type TEXT NOT NULL CHECK (fare_type IN ('flat','band','timeband')),
  
  -- Flat fare
  flat_fare NUMERIC(10,2),
  
  -- Banded/timeband fares
  min_fare NUMERIC(10,2),
  per_km NUMERIC(10,2),
  per_min NUMERIC(10,2),
  
  -- Conditions (JSON for flexibility)
  conditions JSONB DEFAULT '{}', -- {"day_of_week": ["sat","sun"], "time_range": "06:00-22:00"}
  
  UNIQUE(profile_id, zone_id, fare_type)
);
CREATE TABLE pop_pricing (
  id SERIAL PRIMARY KEY,
  profile_id INT NOT NULL REFERENCES pricing_profiles(id) ON DELETE CASCADE,
  
  -- POI-specific pricing
  poi_id INT REFERENCES pois(id),
  poi_mode TEXT CHECK (poi_mode IN ('pickup','dropoff','either')),
  
  -- Cross-province pricing
  cross_province BOOLEAN DEFAULT FALSE,
  origin_region_id TEXT REFERENCES regions(region_id),
  dest_region_id TEXT REFERENCES regions(region_id),
  
  -- Pricing structure
  base_fare NUMERIC(10,2),
  per_km NUMERIC(10,2),
  per_min NUMERIC(10,2),
  surcharge NUMERIC(10,2),
  multiplier NUMERIC(4,2) DEFAULT 1.0,
  
  -- Partnership surcharges (NAIA, Ayala malls, etc.)
  partnership_surcharge NUMERIC(10,2) DEFAULT 0,
  partnership_name TEXT,
  
  UNIQUE(profile_id, poi_id, poi_mode, origin_region_id, dest_region_id)
);
CREATE INDEX idx_tnvs_fares_profile_vehicle ON tnvs_fares(profile_id, vehicle_type);
CREATE INDEX idx_taxi_fares_profile ON taxi_fares(profile_id);
CREATE INDEX idx_special_fares_region ON special_region_fares(region_name);
CREATE INDEX idx_pop_pricing_poi ON pop_pricing(poi_id);
CREATE INDEX idx_pop_pricing_regions ON pop_pricing(origin_region_id, dest_region_id);
CREATE TABLE pricing_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_id TEXT NOT NULL,
  service_key TEXT NOT NULL CHECK (service_key IN ('tnvs','taxi','special','pop')),
  vehicle_type TEXT CHECK (vehicle_type IN ('4_seat','6_seat')),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','active','retired','shadow')),
  booking_fee REAL DEFAULT 69.00,
  effective_at TEXT DEFAULT (datetime('now')),
  supersedes_id INTEGER REFERENCES pricing_profiles(id),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  created_by TEXT DEFAULT 'system',
  updated_at TEXT DEFAULT (datetime('now')),
  updated_by TEXT DEFAULT 'system', transparency_mode TEXT DEFAULT 'summary_only' 
CHECK (transparency_mode IN ('summary_only','detailed_breakdown')),
  
  FOREIGN KEY (region_id) REFERENCES regions(region_id) ON DELETE CASCADE
);
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE surge_controls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  
  -- Surge types
  surge_type TEXT NOT NULL CHECK (surge_type IN ('multiplicative','additive','predictive')),
  
  -- Multiplicative surge (1.1x - 2.0x)
  multiplier_min REAL DEFAULT 1.1,
  multiplier_max REAL DEFAULT 2.0,
  
  -- Additive surge (+₱ fixed)
  additive_amount REAL DEFAULT 0,
  
  -- Predictive surge triggers
  weather_trigger INTEGER DEFAULT 0, -- SQLite boolean as integer
  traffic_trigger INTEGER DEFAULT 0, -- SQLite boolean as integer
  event_trigger INTEGER DEFAULT 0, -- SQLite boolean as integer
  
  -- Activation thresholds
  demand_supply_ratio_threshold REAL DEFAULT 2.0,
  activation_latency_seconds INTEGER DEFAULT 300, -- 5 minutes
  
  active INTEGER DEFAULT 1, -- SQLite boolean as integer
  created_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (profile_id) REFERENCES pricing_profiles(id) ON DELETE CASCADE
);
CREATE TABLE tolls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  route_code TEXT NOT NULL UNIQUE,
  amount REAL NOT NULL,
  
  -- Geographic constraints
  region_id TEXT REFERENCES regions(region_id),
  origin_lat REAL,
  origin_lng REAL,
  destination_lat REAL,
  destination_lng REAL,
  
  -- Auto-detection settings
  auto_detect INTEGER DEFAULT 1, -- SQLite boolean as integer
  detection_radius_meters INTEGER DEFAULT 500,
  
  active INTEGER DEFAULT 1, -- SQLite boolean as integer
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE trip_tolls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id TEXT NOT NULL, -- UUID as text for flexibility
  toll_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  
  -- Reconciliation
  auto_detected INTEGER DEFAULT 0, -- SQLite boolean as integer
  deviation_amount REAL DEFAULT 0,
  reconciled INTEGER DEFAULT 0, -- SQLite boolean as integer
  
  applied_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (toll_id) REFERENCES tolls(id),
  UNIQUE(trip_id, toll_id)
);
CREATE TABLE pricing_simulations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  simulation_name TEXT NOT NULL,
  
  -- Simulation parameters
  test_percentage REAL DEFAULT 5.0, -- % of rides to test
  duration_days INTEGER DEFAULT 7,
  
  -- Metrics tracking
  baseline_conversion_rate REAL,
  test_conversion_rate REAL,
  revenue_impact_pct REAL,
  rider_satisfaction_impact REAL,
  
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','running','completed','cancelled')),
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  created_by TEXT DEFAULT 'system',
  
  FOREIGN KEY (profile_id) REFERENCES pricing_profiles(id) ON DELETE CASCADE
);
CREATE TABLE pricing_compliance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  
  compliance_type TEXT NOT NULL CHECK (compliance_type IN ('ltfrb','doi','lgu','internal')),
  rule_description TEXT NOT NULL,
  
  compliant INTEGER DEFAULT 1, -- SQLite boolean as integer
  violation_details TEXT,
  remediation_required INTEGER DEFAULT 0, -- SQLite boolean as integer
  remediation_deadline TEXT,
  
  checked_at TEXT DEFAULT (datetime('now')),
  checked_by TEXT DEFAULT 'system',
  
  FOREIGN KEY (profile_id) REFERENCES pricing_profiles(id) ON DELETE CASCADE
);
CREATE INDEX idx_pricing_profiles_region_service ON pricing_profiles(region_id, service_key);
CREATE INDEX idx_pricing_profiles_status ON pricing_profiles(status);
CREATE INDEX idx_tolls_region ON tolls(region_id);
CREATE INDEX idx_tolls_route_code ON tolls(route_code);
CREATE INDEX idx_trip_tolls_trip ON trip_tolls(trip_id);
CREATE INDEX idx_surge_controls_profile ON surge_controls(profile_id);
CREATE INDEX idx_compliance_profile ON pricing_compliance(profile_id);
CREATE TABLE pricing_components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  key TEXT NOT NULL,                        -- 'base_fare','included_km','per_km','per_min','booking_fee', etc.
  value_numeric REAL,                       -- number value (amount/rate)
  unit TEXT,                                -- 'PHP','KM','PHP_PER_KM','PHP_PER_MIN'
  description TEXT,                         -- rider-safe copy (markdown ok)
  publish INTEGER NOT NULL DEFAULT 1,      -- show in rider breakdown? (SQLite boolean as INTEGER)
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (profile_id) REFERENCES pricing_profiles(id) ON DELETE CASCADE,
  UNIQUE (profile_id, key)
);
CREATE INDEX pricing_components_profile_idx ON pricing_components(profile_id);
CREATE TABLE pricing_earnings_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  driver_comp_model TEXT NOT NULL
    CHECK (driver_comp_model IN ('commission','salaried','lease','hybrid')),
  fare_recipient TEXT NOT NULL
    CHECK (fare_recipient IN ('driver','xpress','partner_fleet')),
  revenue_split TEXT NOT NULL DEFAULT '{}', -- JSON as TEXT in SQLite
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (profile_id) REFERENCES pricing_profiles(id) ON DELETE CASCADE,
  UNIQUE (profile_id)
);
CREATE TABLE pricing_role_access (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL, -- UUID as text in SQLite
  scope TEXT NOT NULL DEFAULT 'global',  -- 'global' or region code/id
  role TEXT NOT NULL
    CHECK (role IN ('pricing_viewer','pricing_editor','pricing_strategist','pricing_admin')),
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX pricing_role_access_user_scope_idx
  ON pricing_role_access(user_id, scope);
CREATE TABLE pricing_profile_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,     -- the base profile
  link_type TEXT NOT NULL CHECK (link_type IN ('surge','surcharge','toll','special','pop')),
  linked_profile_id INTEGER NOT NULL,
  
  FOREIGN KEY (profile_id) REFERENCES pricing_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_profile_id) REFERENCES pricing_profiles(id) ON DELETE CASCADE,
  UNIQUE (profile_id, link_type, linked_profile_id)
);
CREATE INDEX ppl_profile_idx ON pricing_profile_links(profile_id);
CREATE TABLE pricing_activation_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  requested_by TEXT NOT NULL,                     -- UUID as TEXT in SQLite
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  diff TEXT NOT NULL,                             -- JSON as TEXT in SQLite (old→new values)
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected','cancelled')) DEFAULT 'pending',
  emergency_blocked INTEGER NOT NULL DEFAULT 0,  -- BOOLEAN as INTEGER in SQLite
  effective_at TEXT,                              -- When activation should take effect
  supersede_profile_id INTEGER,                   -- Profile being replaced
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (profile_id) REFERENCES pricing_profiles(id) ON DELETE CASCADE
);
CREATE TABLE pricing_activation_approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  approver_id TEXT NOT NULL,                      -- UUID as TEXT in SQLite
  approved_at TEXT NOT NULL DEFAULT (datetime('now')),
  decision TEXT NOT NULL CHECK (decision IN ('approved','rejected')),
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (request_id) REFERENCES pricing_activation_requests(id) ON DELETE CASCADE,
  UNIQUE (request_id, approver_id)
);
CREATE INDEX par_profile_idx ON pricing_activation_requests(profile_id);
CREATE INDEX par_status_idx ON pricing_activation_requests(status);
CREATE INDEX paa_request_idx ON pricing_activation_approvals(request_id);
CREATE TABLE pricing_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,                          -- UUID as TEXT in SQLite
  action TEXT NOT NULL CHECK (action IN (
    'update_component',
    'update_description', 
    'publish_toggle',
    'transparency_change',
    'earnings_change',
    'link_change',
    'profile_status_change',
    'profile_create',
    'profile_activate',
    'profile_retire'
  )),
  old_value TEXT,                                 -- JSON as TEXT (nullable for creates)
  new_value TEXT,                                 -- JSON as TEXT (nullable for deletes)
  entity_type TEXT,                               -- 'profile', 'component', 'earnings_policy', 'link'
  entity_id TEXT,                                 -- ID of specific entity being changed
  change_reason TEXT,                             -- Optional reason/context
  ip_address TEXT,                                -- For security tracking
  user_agent TEXT,                                -- Browser/API client info
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profile_id) REFERENCES pricing_profiles(id) ON DELETE CASCADE
);
CREATE INDEX pal_profile_idx ON pricing_audit_log(profile_id);
CREATE INDEX pal_user_idx ON pricing_audit_log(user_id);
CREATE INDEX pal_action_idx ON pricing_audit_log(action);
CREATE INDEX pal_created_idx ON pricing_audit_log(created_at);
CREATE INDEX pal_entity_idx ON pricing_audit_log(entity_type, entity_id);
CREATE TABLE pricing_feature_flags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_id TEXT NOT NULL,                        -- Region identifier
  service_key TEXT NOT NULL CHECK (service_key IN ('tnvs','taxi','special','pop')),
  flag TEXT NOT NULL CHECK (flag IN ('micro_zones','predictive_surge','personalization','experiments')),
  enabled INTEGER NOT NULL DEFAULT 0,            -- BOOLEAN as INTEGER in SQLite
  config TEXT,                                    -- JSON configuration for the feature
  description TEXT,                               -- Human-readable description
  created_by TEXT,                                -- UUID of user who created
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE (region_id, service_key, flag)
);
CREATE INDEX pff_region_service_idx ON pricing_feature_flags(region_id, service_key);
CREATE INDEX pff_flag_idx ON pricing_feature_flags(flag, enabled);
CREATE TABLE pricing_emergency_flags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  active INTEGER NOT NULL DEFAULT 0,             -- BOOLEAN as INTEGER in SQLite
  reason TEXT,                                    -- Why emergency brake was activated
  severity_level TEXT CHECK (severity_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  affected_regions TEXT,                          -- JSON array of region IDs (null = all regions)
  affected_services TEXT,                         -- JSON array of service keys (null = all services)
  set_by TEXT,                                    -- UUID of user who set the flag
  set_at TEXT DEFAULT (datetime('now')),
  cleared_by TEXT,                                -- UUID of user who cleared the flag
  cleared_at TEXT,
  auto_clear_at TEXT,                             -- Optional automatic clearing time
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX pef_single_active ON pricing_emergency_flags(active) WHERE active = 1;
CREATE INDEX pef_active_idx ON pricing_emergency_flags(active, set_at);
CREATE TABLE pricing_integrity_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_type TEXT NOT NULL CHECK (report_type IN ('nightly', 'on_demand', 'compliance_audit')),
  generated_at TEXT NOT NULL DEFAULT (datetime('now')),
  generated_by TEXT,                              -- UUID of user or 'system' for automated
  total_issues INTEGER NOT NULL DEFAULT 0,
  critical_issues INTEGER NOT NULL DEFAULT 0,
  warning_issues INTEGER NOT NULL DEFAULT 0,
  issues TEXT NOT NULL,                           -- JSON array of IntegrityIssue objects
  remediation_status TEXT CHECK (remediation_status IN ('pending', 'in_progress', 'resolved', 'ignored')) DEFAULT 'pending',
  remediated_by TEXT,                             -- UUID of user who resolved issues
  remediated_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE pricing_integrity_issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  code TEXT NOT NULL,                             -- 'ORPHANED_LINK', 'MISSING_EARNINGS_POLICY', etc.
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'error', 'critical')),
  entity_type TEXT NOT NULL,                      -- 'pricing_profile_links', 'pricing_components', etc.
  entity_id TEXT,                                 -- ID of affected entity
  context TEXT,                                   -- JSON context data
  status TEXT CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')) DEFAULT 'open',
  assigned_to TEXT,                               -- UUID of user assigned to fix
  resolved_at TEXT,
  resolution_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (report_id) REFERENCES pricing_integrity_reports(id) ON DELETE CASCADE
);
CREATE INDEX pir_type_date_idx ON pricing_integrity_reports(report_type, generated_at);
CREATE INDEX pii_status_idx ON pricing_integrity_issues(status, severity);
CREATE INDEX pii_entity_idx ON pricing_integrity_issues(entity_type, entity_id);
CREATE TABLE pricing_compliance_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_id TEXT NOT NULL,
  service_key TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  rule_value TEXT NOT NULL,             -- JSON as TEXT in SQLite (threshold values, config)
  severity TEXT NOT NULL DEFAULT 'warning',
  active INTEGER NOT NULL DEFAULT 1,    -- BOOLEAN as INTEGER in SQLite
  message TEXT NOT NULL,                -- Human-readable rule description
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  UNIQUE (region_id, service_key, rule_type),
  CHECK (service_key IN ('tnvs','taxi','special','pop')),
  CHECK (rule_type IN ('min_base_fare','max_surge_multiplier','max_per_km_rate','min_booking_fee','required_transparency','earnings_policy_required')),
  CHECK (severity IN ('warning','error'))
);
CREATE INDEX pcr_region_service_idx ON pricing_compliance_rules(region_id, service_key);
CREATE INDEX pcr_active_idx ON pricing_compliance_rules(active);
CREATE TABLE surge_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_id TEXT NOT NULL,
  service_key TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  model_version TEXT NOT NULL DEFAULT 'v1',
  max_multiplier REAL NOT NULL DEFAULT 2.0,
  additive_enabled INTEGER NOT NULL DEFAULT 0,        -- BOOLEAN as INTEGER in SQLite
  smoothing_half_life_sec INTEGER NOT NULL DEFAULT 600,
  update_interval_sec INTEGER NOT NULL DEFAULT 300,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  created_by TEXT,                                    -- UUID as TEXT in SQLite
  updated_at TEXT DEFAULT (datetime('now')),
  updated_by TEXT,                                    -- UUID as TEXT in SQLite
  
  CHECK (service_key IN ('tnvs','special','pop','taxi')),
  CHECK (status IN ('draft','active','retired','shadow')),
  FOREIGN KEY (region_id) REFERENCES regions(region_id) ON DELETE CASCADE
);
CREATE INDEX surge_profiles_region_service_idx 
  ON surge_profiles(region_id, service_key, status);
CREATE TABLE surge_hex_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_id TEXT NOT NULL,
  service_key TEXT NOT NULL,
  h3_index TEXT NOT NULL,                             -- e.g., '8a2a1072b59ffff'
  h3_res INTEGER NOT NULL,                            -- 6..10 typical
  multiplier REAL NOT NULL DEFAULT 1.0,
  additive_fee REAL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'ml',
  profile_id INTEGER REFERENCES surge_profiles(id),
  valid_from TEXT NOT NULL DEFAULT (datetime('now')),
  valid_until TEXT,                                   -- optional TTL for overrides
  computed_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  CHECK (service_key IN ('tnvs','special','pop','taxi')),
  CHECK (source IN ('ml','manual','scheduled','shadow')),
  FOREIGN KEY (region_id) REFERENCES regions(region_id) ON DELETE CASCADE,
  UNIQUE (service_key, h3_index, valid_from)
);
CREATE INDEX surge_hex_state_lookup_idx 
  ON surge_hex_state(service_key, h3_index, computed_at DESC);
CREATE TABLE surge_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_id TEXT NOT NULL,
  h3_index TEXT NOT NULL,
  ts_minute TEXT NOT NULL,                            -- timestamp as TEXT in SQLite
  req_count INTEGER NOT NULL DEFAULT 0,               -- rider requests
  searchers INTEGER NOT NULL DEFAULT 0,               -- riders searching but not booked
  active_drivers INTEGER NOT NULL DEFAULT 0,
  avg_eta_sec INTEGER,
  cancels INTEGER NOT NULL DEFAULT 0,
  weather_score REAL,                                 -- normalized 0..1
  traffic_score REAL,
  event_score REAL,
  
  FOREIGN KEY (region_id) REFERENCES regions(region_id) ON DELETE CASCADE,
  UNIQUE (h3_index, ts_minute)
);
CREATE INDEX surge_signals_hex_time_idx 
  ON surge_signals(h3_index, ts_minute DESC);
CREATE TABLE surge_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_id TEXT NOT NULL,
  service_key TEXT NOT NULL,
  name TEXT NOT NULL,
  multiplier REAL NOT NULL DEFAULT 1.2,
  additive_fee REAL DEFAULT 0,
  starts_at TEXT NOT NULL,                            -- timestamp as TEXT in SQLite
  ends_at TEXT NOT NULL,                              -- timestamp as TEXT in SQLite
  h3_set TEXT,                                        -- JSON array as TEXT; null = region-wide (non-taxi)
  created_by TEXT,                                    -- UUID as TEXT in SQLite
  created_at TEXT DEFAULT (datetime('now')),
  
  CHECK (service_key IN ('tnvs','special','pop','taxi')),
  FOREIGN KEY (region_id) REFERENCES regions(region_id) ON DELETE CASCADE
);
CREATE TABLE surge_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_id TEXT NOT NULL,
  service_key TEXT NOT NULL,
  reason TEXT NOT NULL,
  multiplier REAL NOT NULL,
  additive_fee REAL DEFAULT 0,
  h3_set TEXT NOT NULL,                               -- JSON array as TEXT in SQLite
  starts_at TEXT NOT NULL DEFAULT (datetime('now')),
  ends_at TEXT NOT NULL,
  requested_by TEXT NOT NULL,                         -- UUID as TEXT in SQLite
  status TEXT NOT NULL DEFAULT 'pending',
  approval_request_id INTEGER,                        -- link to pricing_activation_requests
  created_at TEXT DEFAULT (datetime('now')),
  
  CHECK (service_key IN ('tnvs','special','pop','taxi')),
  CHECK (status IN ('pending','approved','rejected','cancelled')),
  FOREIGN KEY (region_id) REFERENCES regions(region_id) ON DELETE CASCADE,
  FOREIGN KEY (approval_request_id) REFERENCES pricing_activation_requests(id)
);
CREATE TABLE surge_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_id TEXT NOT NULL,
  service_key TEXT NOT NULL,
  user_id TEXT NOT NULL,                              -- UUID as TEXT in SQLite
  action TEXT NOT NULL,                               -- 'profile_update','override_create','schedule_create','model_change'
  old_value TEXT,                                     -- JSON as TEXT in SQLite
  new_value TEXT,                                     -- JSON as TEXT in SQLite
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (region_id) REFERENCES regions(region_id) ON DELETE CASCADE
);
CREATE INDEX surge_audit_idx 
  ON surge_audit_log(region_id, service_key, created_at DESC);
CREATE TABLE surge_hex_meta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_id TEXT NOT NULL,
  h3_index TEXT NOT NULL,
  trips_30d INTEGER NOT NULL DEFAULT 0,
  recommended_res INTEGER NOT NULL,                   -- recommended H3 resolution for this hex
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (region_id) REFERENCES regions(region_id) ON DELETE CASCADE,
  UNIQUE (h3_index)
);
CREATE TABLE pricing_profiles_v4 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_id TEXT NOT NULL,
  service_key TEXT NOT NULL CHECK (service_key IN ('tnvs','taxi','special','pop','twg')),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','filed','active','retired')) DEFAULT 'draft',
  
  -- Regulator compliance fields
  regulator_status TEXT CHECK (regulator_status IN ('draft','filed','approved','rejected')),
  regulator_ref TEXT,
  regulator_filed_at TEXT,
  regulator_approved_at TEXT,
  regulator_expires_at TEXT,
  
  -- Core pricing components
  base_fare REAL NOT NULL DEFAULT 0,
  base_included_km REAL DEFAULT 0,
  per_km REAL NOT NULL DEFAULT 0,
  per_minute REAL DEFAULT 0,
  booking_fee REAL DEFAULT 0,
  
  -- Surcharges and additional fees
  airport_surcharge REAL DEFAULT 0,
  poi_surcharge REAL DEFAULT 0,
  toll_passthrough INTEGER DEFAULT 1, -- boolean as integer
  
  -- Rider-facing descriptions with publish toggles
  description TEXT, -- JSON stored as TEXT
  
  -- Earnings routing configuration
  earnings_routing TEXT CHECK (earnings_routing IN ('driver','fleet','xpress')) DEFAULT 'driver',
  driver_commission_pct REAL DEFAULT 0.8,
  fleet_commission_pct REAL DEFAULT 0,
  
  -- AI/ML fields
  ai_health_score REAL DEFAULT 0,
  ai_last_forecast TEXT, -- JSON stored as TEXT
  ai_last_recommendations TEXT, -- JSON stored as TEXT
  ai_elasticity_coefficient REAL,
  
  -- Metadata
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT, -- UUID as TEXT in SQLite
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT,
  
  FOREIGN KEY (region_id) REFERENCES regions(region_id) ON DELETE CASCADE
);
CREATE TABLE pricing_proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  proposed_by TEXT NOT NULL, -- UUID as TEXT
  
  -- Proposal details
  title TEXT NOT NULL,
  description TEXT,
  diff TEXT NOT NULL, -- JSON diff of changes
  
  -- Compliance and validation
  compliance_result TEXT, -- JSON validation results
  regulator_required INTEGER DEFAULT 0, -- boolean
  regulator_filed INTEGER DEFAULT 0, -- boolean
  
  -- Workflow status
  status TEXT CHECK (status IN ('pending','approved','rejected','cancelled')) DEFAULT 'pending',
  needs_approvals INTEGER DEFAULT 2,
  current_approvals INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  approved_by TEXT, -- UUID of final approver
  approved_at TEXT,
  effective_at TEXT,
  
  FOREIGN KEY (profile_id) REFERENCES pricing_profiles_v4(id) ON DELETE CASCADE
);
CREATE TABLE pricing_forecasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  
  -- Forecast parameters
  horizon_days INTEGER NOT NULL CHECK (horizon_days IN (30, 60, 90)),
  metric_key TEXT NOT NULL CHECK (metric_key IN ('trips','revenue','roi','demand_elasticity')),
  
  -- Forecast results
  baseline_value REAL NOT NULL,
  predicted_value REAL NOT NULL,
  confidence REAL CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Supporting data
  model_version TEXT DEFAULT 'v1.0',
  input_features TEXT, -- JSON of features used
  
  generated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (profile_id) REFERENCES pricing_profiles_v4(id) ON DELETE CASCADE
);
CREATE TABLE pricing_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  
  -- Recommendation details
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('increase_fare','decrease_fare','adjust_structure','surge_optimize','compliance_warning')),
  message TEXT NOT NULL,
  details TEXT, -- JSON with specific recommendations
  
  -- AI confidence and flags
  confidence REAL CHECK (confidence >= 0 AND confidence <= 1),
  compliance_flag INTEGER DEFAULT 0, -- boolean
  regulator_impact INTEGER DEFAULT 0, -- boolean - requires regulator filing
  
  -- Status and actions
  status TEXT CHECK (status IN ('pending','accepted','rejected','superseded')) DEFAULT 'pending',
  
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  actioned_by TEXT, -- UUID of user who acted
  actioned_at TEXT,
  
  FOREIGN KEY (profile_id) REFERENCES pricing_profiles_v4(id) ON DELETE CASCADE
);
CREATE TABLE pricing_audit_v4 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER,
  proposal_id INTEGER,
  
  -- User and action details
  user_id TEXT NOT NULL, -- UUID as TEXT
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('profile','proposal','forecast','recommendation','surge')),
  entity_id INTEGER,
  
  -- Change tracking
  old_value TEXT, -- JSON of old state
  new_value TEXT, -- JSON of new state
  
  -- Compliance and regulator tracking
  compliance_impact INTEGER DEFAULT 0, -- boolean
  regulator_notification_sent INTEGER DEFAULT 0, -- boolean
  
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (profile_id) REFERENCES pricing_profiles_v4(id) ON DELETE SET NULL,
  FOREIGN KEY (proposal_id) REFERENCES pricing_proposals(id) ON DELETE SET NULL
);
CREATE TABLE pricing_regulator_filings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL,
  
  -- Filing details
  regulator_type TEXT NOT NULL CHECK (regulator_type IN ('LTFRB','TWG')),
  filing_reference TEXT NOT NULL,
  filing_date TEXT NOT NULL,
  
  -- Filing content
  filing_package TEXT NOT NULL, -- JSON export package
  approval_status TEXT CHECK (approval_status IN ('submitted','under_review','approved','rejected')) DEFAULT 'submitted',
  
  -- Response tracking
  regulator_response TEXT, -- JSON response from regulator
  approved_at TEXT,
  expires_at TEXT,
  
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL, -- UUID
  
  FOREIGN KEY (profile_id) REFERENCES pricing_profiles_v4(id) ON DELETE CASCADE
);
CREATE TABLE pricing_proposal_approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id INTEGER NOT NULL,
  
  -- Approver details
  approver_id TEXT NOT NULL, -- UUID
  approver_role TEXT NOT NULL,
  
  -- Approval details
  decision TEXT NOT NULL CHECK (decision IN ('approved','rejected')),
  comment TEXT,
  approval_level INTEGER NOT NULL, -- 1st approval, 2nd approval, etc.
  
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (proposal_id) REFERENCES pricing_proposals(id) ON DELETE CASCADE
);
CREATE INDEX pricing_profiles_v4_service_status_idx 
  ON pricing_profiles_v4(service_key, status);
CREATE INDEX pricing_profiles_v4_region_service_idx 
  ON pricing_profiles_v4(region_id, service_key);
CREATE INDEX pricing_proposals_status_idx 
  ON pricing_proposals(status, created_at DESC);
CREATE INDEX pricing_forecasts_profile_metric_idx 
  ON pricing_forecasts(profile_id, metric_key, horizon_days);
CREATE INDEX pricing_recommendations_profile_status_idx 
  ON pricing_recommendations(profile_id, status, created_at DESC);
CREATE INDEX pricing_audit_v4_profile_created_idx 
  ON pricing_audit_v4(profile_id, created_at DESC);
CREATE INDEX pricing_regulator_filings_profile_idx 
  ON pricing_regulator_filings(profile_id, regulator_type);
CREATE TABLE roles (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 0,
    permissions TEXT DEFAULT '[]',
    inherits_from TEXT DEFAULT '[]',
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
, role_id TEXT);
CREATE TABLE regions (id TEXT PRIMARY KEY, name TEXT, code TEXT);
CREATE TABLE vehicles (
    id TEXT PRIMARY KEY,
    vehicle_code TEXT NOT NULL UNIQUE,
    license_plate TEXT NOT NULL UNIQUE,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    color TEXT NOT NULL,
    category TEXT NOT NULL,
    fuel_type TEXT NOT NULL,
    ownership_type TEXT NOT NULL,
    seating_capacity INTEGER NOT NULL,
    region_id TEXT NOT NULL,
    service_types TEXT NOT NULL,
    status TEXT DEFAULT 'inactive',
    condition_rating TEXT DEFAULT 'good',
    condition_score DECIMAL(5,2) DEFAULT 75.00,
    registration_expiry TEXT NOT NULL,
    insurance_expiry TEXT,
    next_maintenance_due TEXT,
    obd_device_installed INTEGER DEFAULT 0,
    maintenance_alerts_count INTEGER DEFAULT 0,
    fuel_efficiency_kmpl DECIMAL(6,2),
    total_trips INTEGER DEFAULT 0,
    total_distance_km DECIMAL(10,2) DEFAULT 0.00,
    average_rating DECIMAL(3,2) DEFAULT 5.00,
    utilization_rate DECIMAL(5,2) DEFAULT 0.00,
    availability_score DECIMAL(5,2) DEFAULT 100.00,
    ltfrb_franchise_expiry TEXT,
    created_at TEXT DEFAULT '2024-09-06 10:00:00',
    updated_at TEXT DEFAULT '2024-09-06 10:00:00',
    is_active INTEGER DEFAULT 1
);
CREATE VIEW v_vehicle_dashboard AS
SELECT 
    v.id,
    v.vehicle_code,
    v.license_plate,
    v.make,
    v.model,
    v.year,
    v.ownership_type,
    v.status,
    v.condition_rating,
    v.region_id,
    r.name as region_name,
    
    -- Mock current assignment
    NULL as current_driver_id,
    NULL as current_driver_name,
    'primary' as assignment_type,
    
    -- Mock performance metrics (30 days)
    25 as total_trips_30d,
    75.0 as avg_utilization_30d,
    v.fuel_efficiency_kmpl as avg_fuel_efficiency_30d,
    35000.0 as total_revenue_30d,
    
    -- Maintenance status
    v.next_maintenance_due,
    'current' as maintenance_status,
    
    -- Alert counts
    v.maintenance_alerts_count as active_maintenance_alerts,
    0 as active_compliance_alerts,
    
    -- OBD status
    CASE WHEN v.obd_device_installed = 1 THEN 'connected' ELSE 'not_installed' END as obd_status,
    '2024-09-06 08:00:00' as obd_last_connection,
    
    -- Compliance status
    'compliant' as overall_compliance_status,
    v.ltfrb_franchise_expiry as franchise_expiry_date,
    
    -- Last activity
    v.updated_at as last_updated
    
FROM vehicles v
JOIN regions r ON v.region_id = r.id
WHERE v.is_active = 1
/* v_vehicle_dashboard(id,vehicle_code,license_plate,make,model,year,ownership_type,status,condition_rating,region_id,region_name,current_driver_id,current_driver_name,assignment_type,total_trips_30d,avg_utilization_30d,avg_fuel_efficiency_30d,total_revenue_30d,next_maintenance_due,maintenance_status,active_maintenance_alerts,active_compliance_alerts,obd_status,obd_last_connection,overall_compliance_status,franchise_expiry_date,last_updated) */;
