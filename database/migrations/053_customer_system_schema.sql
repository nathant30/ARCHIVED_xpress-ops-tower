-- Migration: 053_customer_system_schema.sql
-- Description: Create customer management system tables
-- Created: 2025-09-05

-- Customers table (extends users table)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  customer_number VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  phone VARCHAR(20),
  email VARCHAR(255),
  profile_picture_url TEXT,
  preferred_language VARCHAR(10) DEFAULT 'en',
  emergency_contact JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'deleted')),
  verification_status VARCHAR(50) NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verification_documents JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer addresses
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  address_type VARCHAR(50) NOT NULL CHECK (address_type IN ('home', 'work', 'other')),
  label VARCHAR(100),
  street_address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) NOT NULL DEFAULT 'Philippines',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer support tickets
CREATE TABLE customer_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  ride_id UUID REFERENCES rides(id),
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'escalated')),
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  assigned_to UUID REFERENCES users(id),
  resolution TEXT,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_feedback TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  escalated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer support ticket messages
CREATE TABLE support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES customer_support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'support_agent', 'system')),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer ride ratings and feedback
CREATE TABLE customer_ride_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  ride_id UUID NOT NULL REFERENCES rides(id),
  driver_id UUID NOT NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  driver_rating INTEGER CHECK (driver_rating BETWEEN 1 AND 5),
  vehicle_rating INTEGER CHECK (vehicle_rating BETWEEN 1 AND 5),
  punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
  feedback TEXT,
  compliments JSONB DEFAULT '[]',
  complaints JSONB DEFAULT '[]',
  would_recommend BOOLEAN,
  tip_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(customer_id, ride_id)
);

-- Customer promotions and discounts
CREATE TABLE customer_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  promotion_code VARCHAR(50) NOT NULL,
  promotion_name VARCHAR(255) NOT NULL,
  promotion_type VARCHAR(50) NOT NULL CHECK (promotion_type IN ('percentage', 'fixed_amount', 'free_ride', 'cashback')),
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_fare DECIMAL(10,2) DEFAULT 0,
  maximum_discount DECIMAL(10,2),
  usage_limit INTEGER DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  applicable_regions JSONB DEFAULT '[]',
  applicable_vehicle_types JSONB DEFAULT '[]',
  terms_conditions TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer loyalty points
CREATE TABLE customer_loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  points INTEGER NOT NULL,
  ride_id UUID REFERENCES rides(id),
  promotion_id UUID REFERENCES customer_promotions(id),
  description TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer referrals
CREATE TABLE customer_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_customer_id UUID NOT NULL REFERENCES customers(id),
  referred_customer_id UUID REFERENCES customers(id),
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referred_email VARCHAR(255),
  referred_phone VARCHAR(20),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  referrer_reward DECIMAL(10,2) DEFAULT 0,
  referred_reward DECIMAL(10,2) DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_customer_number ON customers(customer_number);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_verification_status ON customers(verification_status);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX idx_customer_addresses_type_default ON customer_addresses(customer_id, address_type, is_default);
CREATE INDEX idx_customer_addresses_location ON customer_addresses(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX idx_support_tickets_customer_id ON customer_support_tickets(customer_id);
CREATE INDEX idx_support_tickets_status ON customer_support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON customer_support_tickets(priority);
CREATE INDEX idx_support_tickets_assigned_to ON customer_support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_created_at ON customer_support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_ride_id ON customer_support_tickets(ride_id);

CREATE INDEX idx_support_messages_ticket_id ON support_ticket_messages(ticket_id);
CREATE INDEX idx_support_messages_sender ON support_ticket_messages(sender_id, sender_type);
CREATE INDEX idx_support_messages_created_at ON support_ticket_messages(created_at DESC);

CREATE INDEX idx_customer_ratings_customer_id ON customer_ride_ratings(customer_id);
CREATE INDEX idx_customer_ratings_ride_id ON customer_ride_ratings(ride_id);
CREATE INDEX idx_customer_ratings_driver_id ON customer_ride_ratings(driver_id);
CREATE INDEX idx_customer_ratings_overall ON customer_ride_ratings(overall_rating);
CREATE INDEX idx_customer_ratings_created_at ON customer_ride_ratings(created_at DESC);

CREATE INDEX idx_customer_promotions_customer_id ON customer_promotions(customer_id);
CREATE INDEX idx_customer_promotions_code ON customer_promotions(promotion_code);
CREATE INDEX idx_customer_promotions_status ON customer_promotions(status);
CREATE INDEX idx_customer_promotions_valid_period ON customer_promotions(valid_from, valid_until);

CREATE INDEX idx_loyalty_points_customer_id ON customer_loyalty_points(customer_id);
CREATE INDEX idx_loyalty_points_type ON customer_loyalty_points(transaction_type);
CREATE INDEX idx_loyalty_points_created_at ON customer_loyalty_points(created_at DESC);
CREATE INDEX idx_loyalty_points_expires_at ON customer_loyalty_points(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_referrals_referrer ON customer_referrals(referrer_customer_id);
CREATE INDEX idx_referrals_referred ON customer_referrals(referred_customer_id);
CREATE INDEX idx_referrals_code ON customer_referrals(referral_code);
CREATE INDEX idx_referrals_status ON customer_referrals(status);

-- Triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_addresses_updated_at BEFORE UPDATE ON customer_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON customer_support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_promotions_updated_at BEFORE UPDATE ON customer_promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_referrals_updated_at BEFORE UPDATE ON customer_referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for customer number generation
CREATE OR REPLACE FUNCTION generate_customer_number() RETURNS TEXT AS $$
BEGIN
    RETURN 'CUST' || LPAD(nextval('customer_number_seq')::TEXT, 8, '0');
END;
$$ LANGUAGE plpgsql;

-- Create sequence for customer numbers
CREATE SEQUENCE customer_number_seq START 10000000;

-- Function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS TEXT AS $$
BEGIN
    RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Function to automatically generate customer number on insert
CREATE OR REPLACE FUNCTION set_customer_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_number IS NULL THEN
        NEW.customer_number := generate_customer_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_customer_number_trigger 
    BEFORE INSERT ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION set_customer_number();

-- Function to generate support ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number() RETURNS TEXT AS $$
BEGIN
    RETURN 'TKT' || LPAD(nextval('ticket_number_seq')::TEXT, 8, '0');
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE ticket_number_seq START 10000001;

CREATE OR REPLACE FUNCTION set_ticket_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number_trigger 
    BEFORE INSERT ON customer_support_tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION set_ticket_number();

-- Function to ensure only one default address per customer per type
CREATE OR REPLACE FUNCTION ensure_single_default_address() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE customer_addresses 
        SET is_default = false 
        WHERE customer_id = NEW.customer_id 
          AND address_type = NEW.address_type 
          AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_address_trigger 
    BEFORE INSERT OR UPDATE ON customer_addresses 
    FOR EACH ROW 
    EXECUTE FUNCTION ensure_single_default_address();

-- Views for common queries
CREATE VIEW customer_summary AS
SELECT 
    c.id,
    c.customer_number,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.status,
    c.verification_status,
    c.created_at,
    COUNT(DISTINCT cr.id) as total_rides,
    AVG(crr.overall_rating) as average_rating,
    SUM(CASE WHEN clp.transaction_type = 'earned' THEN clp.points ELSE -clp.points END) as loyalty_points,
    COUNT(DISTINCT cst.id) as support_tickets
FROM customers c
LEFT JOIN rides cr ON c.id = cr.customer_id
LEFT JOIN customer_ride_ratings crr ON c.id = crr.customer_id
LEFT JOIN customer_loyalty_points clp ON c.id = clp.customer_id AND (clp.expires_at IS NULL OR clp.expires_at > CURRENT_TIMESTAMP)
LEFT JOIN customer_support_tickets cst ON c.id = cst.customer_id
GROUP BY c.id, c.customer_number, c.first_name, c.last_name, c.email, c.phone, c.status, c.verification_status, c.created_at;

-- Insert sample support ticket categories
INSERT INTO customer_support_tickets (ticket_number, customer_id, category, subcategory, priority, status, subject, description, created_at) VALUES
('TKT00000001', '00000000-0000-0000-0000-000000000001', 'Payment Issues', 'Failed Payment', 'high', 'open', 'Payment not processed', 'My payment was not processed but I was charged', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
('TKT00000002', '00000000-0000-0000-0000-000000000002', 'Driver Issues', 'Late Arrival', 'medium', 'resolved', 'Driver was very late', 'Driver arrived 20 minutes late without notification', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('TKT00000003', '00000000-0000-0000-0000-000000000003', 'App Issues', 'Booking Problem', 'low', 'closed', 'Cannot book ride', 'App keeps crashing when I try to book', CURRENT_TIMESTAMP - INTERVAL '1 week');

-- Comments
COMMENT ON TABLE customers IS 'Main customer profiles and account information';
COMMENT ON TABLE customer_addresses IS 'Customer saved addresses (home, work, etc.)';
COMMENT ON TABLE customer_support_tickets IS 'Customer support tickets and their status';
COMMENT ON TABLE support_ticket_messages IS 'Messages within support tickets';
COMMENT ON TABLE customer_ride_ratings IS 'Customer ratings and feedback for rides';
COMMENT ON TABLE customer_promotions IS 'Customer-specific promotions and discount codes';
COMMENT ON TABLE customer_loyalty_points IS 'Customer loyalty points transactions';
COMMENT ON TABLE customer_referrals IS 'Customer referral program tracking';
COMMENT ON VIEW customer_summary IS 'Aggregated customer information for dashboards';