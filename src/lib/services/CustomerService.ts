import { 
  Customer, 
  CustomerAddress, 
  CustomerSupportTicket, 
  CustomerRideRating, 
  CustomerPromotion,
  CustomerLoyaltyPoints,
  CustomerReferral,
  CustomerSummary
} from '@/types/customer';
import { DatabaseService } from './DatabaseService';
import bcrypt from 'bcryptjs';

export class CustomerService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  // Customer Registration
  async registerCustomer(data: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    password: string;
    date_of_birth?: string;
    gender?: string;
    preferred_language?: string;
    emergency_contact?: Record<string, any>;
    referral_code?: string;
  }): Promise<{
    customer: Customer;
    user_id: string;
    welcome_promotion?: CustomerPromotion;
  }> {
    // Check if email already exists
    const existingUser = await this.db.query(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Start transaction
    await this.db.query('BEGIN');

    try {
      // Create user account
      const userQuery = `
        INSERT INTO users (email, password, role, status, email_verified)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      
      const userResult = await this.db.query(userQuery, [
        data.email,
        hashedPassword,
        'customer',
        'active',
        false
      ]);

      const user_id = userResult.rows[0].id;

      // Create customer profile
      const customerQuery = `
        INSERT INTO customers (
          user_id, first_name, last_name, email, phone, date_of_birth,
          gender, preferred_language, emergency_contact, status, verification_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const customerValues = [
        user_id,
        data.first_name,
        data.last_name,
        data.email,
        data.phone || null,
        data.date_of_birth || null,
        data.gender || null,
        data.preferred_language || 'en',
        data.emergency_contact ? JSON.stringify(data.emergency_contact) : null,
        'active',
        'unverified'
      ];

      const customerResult = await this.db.query(customerQuery, customerValues);
      const customer = customerResult.rows[0];

      // Handle referral if provided
      let referral_processed = false;
      if (data.referral_code) {
        try {
          await this.processReferral(data.referral_code, customer.id);
          referral_processed = true;
        } catch (error) {
          // Log referral error but don't fail registration
          console.error('Referral processing failed:', error);
        }
      }

      // Create welcome promotion
      const welcome_promotion = await this.createWelcomePromotion(customer.id, referral_processed);

      // Generate referral code for new customer
      await this.generateCustomerReferralCode(customer.id);

      // Award welcome loyalty points
      await this.awardLoyaltyPoints(customer.id, 100, 'Welcome bonus', null, null);

      await this.db.query('COMMIT');

      return {
        customer,
        user_id,
        welcome_promotion
      };

    } catch (error) {
      await this.db.query('ROLLBACK');
      throw error;
    }
  }

  // Get customer profile with all related data
  async getCustomerProfile(customer_id: string): Promise<{
    customer: Customer;
    addresses: CustomerAddress[];
    loyalty_points: number;
    ride_stats: any;
    active_promotions: CustomerPromotion[];
    verification_status: any;
  }> {
    // Get customer basic info
    const customerQuery = 'SELECT * FROM customers WHERE id = $1';
    const customerResult = await this.db.query(customerQuery, [customer_id]);
    
    if (customerResult.rows.length === 0) {
      throw new Error('Customer not found');
    }

    const customer = customerResult.rows[0];

    // Get customer addresses
    const addressesQuery = `
      SELECT * FROM customer_addresses 
      WHERE customer_id = $1 AND is_active = true
      ORDER BY is_default DESC, created_at DESC
    `;
    const addressesResult = await this.db.query(addressesQuery, [customer_id]);

    // Get loyalty points balance
    const loyaltyQuery = `
      SELECT SUM(CASE WHEN transaction_type IN ('earned', 'adjusted') THEN points ELSE -points END) as balance
      FROM customer_loyalty_points 
      WHERE customer_id = $1 
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `;
    const loyaltyResult = await this.db.query(loyaltyQuery, [customer_id]);
    const loyalty_points = parseInt(loyaltyResult.rows[0]?.balance) || 0;

    // Get ride statistics
    const rideStatsQuery = `
      SELECT 
        COUNT(r.id) as total_rides,
        AVG(crr.overall_rating) as average_rating,
        SUM(pt.amount) as lifetime_spending,
        mode() WITHIN GROUP (ORDER BY r.destination_address) as favorite_destination
      FROM rides r
      LEFT JOIN customer_ride_ratings crr ON r.id = crr.ride_id
      LEFT JOIN payment_transactions pt ON r.id = pt.ride_id
      WHERE r.customer_id = $1 AND r.status = 'completed'
    `;
    const rideStatsResult = await this.db.query(rideStatsQuery, [customer_id]);
    const ride_stats = {
      total_rides: parseInt(rideStatsResult.rows[0]?.total_rides) || 0,
      average_rating: parseFloat(rideStatsResult.rows[0]?.average_rating) || 0,
      lifetime_spending: parseFloat(rideStatsResult.rows[0]?.lifetime_spending) || 0,
      favorite_destinations: [rideStatsResult.rows[0]?.favorite_destination].filter(Boolean)
    };

    // Get active promotions
    const promotionsQuery = `
      SELECT * FROM customer_promotions 
      WHERE customer_id = $1 
        AND status = 'active' 
        AND valid_from <= CURRENT_TIMESTAMP 
        AND valid_until >= CURRENT_TIMESTAMP
        AND used_count < usage_limit
      ORDER BY valid_until ASC
    `;
    const promotionsResult = await this.db.query(promotionsQuery, [customer_id]);

    // Get verification status
    const userQuery = `
      SELECT email_verified, phone_verified 
      FROM users 
      WHERE id = $1
    `;
    const userResult = await this.db.query(userQuery, [customer.user_id]);
    const user = userResult.rows[0];

    const verification_status = {
      email_verified: user?.email_verified || false,
      phone_verified: user?.phone_verified || false,
      identity_verified: customer.verification_status === 'verified',
      required_documents: customer.verification_status === 'unverified' 
        ? ['government_id', 'proof_of_address'] 
        : []
    };

    return {
      customer,
      addresses: addressesResult.rows,
      loyalty_points,
      ride_stats,
      active_promotions: promotionsResult.rows,
      verification_status
    };
  }

  // Create support ticket
  async createSupportTicket(data: {
    customer_id: string;
    ride_id?: string;
    category: string;
    subcategory?: string;
    priority?: string;
    subject: string;
    description: string;
    attachments?: any[];
  }): Promise<CustomerSupportTicket> {
    const query = `
      INSERT INTO customer_support_tickets (
        customer_id, ride_id, category, subcategory, priority,
        subject, description, attachments, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      data.customer_id,
      data.ride_id || null,
      data.category,
      data.subcategory || null,
      data.priority || 'medium',
      data.subject,
      data.description,
      JSON.stringify(data.attachments || []),
      'open'
    ];

    const result = await this.db.query(query, values);
    const ticket = result.rows[0];

    // Create initial system message
    await this.addTicketMessage(
      ticket.id,
      'system',
      'system',
      `Support ticket ${ticket.ticket_number} has been created and assigned to our support team. We will respond within 24 hours.`,
      [],
      true
    );

    return ticket;
  }

  // Get customer ride history
  async getCustomerRideHistory(
    customer_id: string, 
    filters: {
      page?: number;
      limit?: number;
      status?: string;
      start_date?: string;
      end_date?: string;
    } = {}
  ): Promise<{
    rides: any[];
    pagination: any;
    summary: any;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = ['r.customer_id = $1'];
    const values = [customer_id];
    let paramCount = 1;

    if (filters.status) {
      conditions.push(`r.status = $${++paramCount}`);
      values.push(filters.status);
    }

    if (filters.start_date) {
      conditions.push(`r.created_at >= $${++paramCount}`);
      values.push(filters.start_date);
    }

    if (filters.end_date) {
      conditions.push(`r.created_at <= $${++paramCount}`);
      values.push(filters.end_date);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM rides r 
      WHERE ${whereClause}
    `;
    const countResult = await this.db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get rides with details
    const ridesQuery = `
      SELECT 
        r.id as ride_id,
        r.created_at as date,
        r.pickup_address,
        r.destination_address,
        r.status,
        d.name as driver_name,
        v.make || ' ' || v.model as vehicle_info,
        pt.amount as fare,
        crr.overall_rating as rating_given,
        CASE WHEN crr.id IS NULL AND r.status = 'completed' THEN true ELSE false END as can_rate
      FROM rides r
      LEFT JOIN drivers d ON r.driver_id = d.id
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN payment_transactions pt ON r.id = pt.ride_id
      LEFT JOIN customer_ride_ratings crr ON r.id = crr.ride_id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    values.push(limit, offset);
    const ridesResult = await this.db.query(ridesQuery, values);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_rides,
        SUM(pt.amount) as total_spent,
        AVG(crr.overall_rating) as average_rating_given,
        mode() WITHIN GROUP (ORDER BY r.pickup_address) as favorite_pickup_location,
        mode() WITHIN GROUP (ORDER BY r.destination_address) as favorite_destination
      FROM rides r
      LEFT JOIN payment_transactions pt ON r.id = pt.ride_id
      LEFT JOIN customer_ride_ratings crr ON r.id = crr.ride_id
      WHERE r.customer_id = $1 AND r.status = 'completed'
    `;

    const summaryResult = await this.db.query(summaryQuery, [customer_id]);
    const summary = summaryResult.rows[0];

    return {
      rides: ridesResult.rows.map(ride => ({
        ...ride,
        can_repeat: true, // All rides can be repeated with same pickup/destination
        fare: parseFloat(ride.fare) || 0
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      summary: {
        total_rides: parseInt(summary?.total_rides) || 0,
        total_spent: parseFloat(summary?.total_spent) || 0,
        average_rating_given: parseFloat(summary?.average_rating_given) || 0,
        favorite_pickup_location: summary?.favorite_pickup_location || '',
        favorite_destination: summary?.favorite_destination || ''
      }
    };
  }

  // Rate a ride
  async rateRide(data: {
    ride_id: string;
    customer_id: string;
    overall_rating: number;
    driver_rating?: number;
    vehicle_rating?: number;
    punctuality_rating?: number;
    cleanliness_rating?: number;
    feedback?: string;
    compliments?: string[];
    complaints?: string[];
    would_recommend?: boolean;
    tip_amount?: number;
  }): Promise<{
    rating_id: string;
    points_earned: number;
    thank_you_message: string;
    driver_notified: boolean;
  }> {
    // Verify ride exists and belongs to customer
    const rideQuery = `
      SELECT id, driver_id, status 
      FROM rides 
      WHERE id = $1 AND customer_id = $2
    `;
    const rideResult = await this.db.query(rideQuery, [data.ride_id, data.customer_id]);

    if (rideResult.rows.length === 0) {
      throw new Error('Ride not found or access denied');
    }

    const ride = rideResult.rows[0];

    if (ride.status !== 'completed') {
      throw new Error('Can only rate completed rides');
    }

    // Check if already rated
    const existingRating = await this.db.query(
      'SELECT id FROM customer_ride_ratings WHERE ride_id = $1 AND customer_id = $2',
      [data.ride_id, data.customer_id]
    );

    if (existingRating.rows.length > 0) {
      throw new Error('Ride has already been rated');
    }

    // Insert rating
    const ratingQuery = `
      INSERT INTO customer_ride_ratings (
        customer_id, ride_id, driver_id, overall_rating, driver_rating,
        vehicle_rating, punctuality_rating, cleanliness_rating, feedback,
        compliments, complaints, would_recommend, tip_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;

    const ratingValues = [
      data.customer_id,
      data.ride_id,
      ride.driver_id,
      data.overall_rating,
      data.driver_rating || null,
      data.vehicle_rating || null,
      data.punctuality_rating || null,
      data.cleanliness_rating || null,
      data.feedback || null,
      JSON.stringify(data.compliments || []),
      JSON.stringify(data.complaints || []),
      data.would_recommend || null,
      data.tip_amount || 0
    ];

    const ratingResult = await this.db.query(ratingQuery, ratingValues);
    const rating_id = ratingResult.rows[0].id;

    // Award loyalty points for rating
    const points_earned = 10; // Base points for rating
    await this.awardLoyaltyPoints(
      data.customer_id,
      points_earned,
      `Rating for ride ${data.ride_id}`,
      data.ride_id,
      null
    );

    // Update driver's average rating (simplified - would normally be more complex)
    await this.updateDriverAverageRating(ride.driver_id);

    return {
      rating_id,
      points_earned,
      thank_you_message: 'Thank you for your feedback! Your rating helps us improve our service.',
      driver_notified: true
    };
  }

  // Get customer promotions
  async getCustomerPromotions(customer_id: string): Promise<{
    active_promotions: CustomerPromotion[];
    expired_promotions: CustomerPromotion[];
    used_promotions: CustomerPromotion[];
    available_referral_rewards: any;
  }> {
    // Get all promotions
    const promotionsQuery = `
      SELECT * FROM customer_promotions 
      WHERE customer_id = $1 
      ORDER BY created_at DESC
    `;
    const promotionsResult = await this.db.query(promotionsQuery, [customer_id]);
    const allPromotions = promotionsResult.rows;

    // Get referral information
    const referralQuery = `
      SELECT 
        referral_code,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_referrals,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_referrals
      FROM customer_referrals 
      WHERE referrer_customer_id = $1
      GROUP BY referral_code
    `;
    const referralResult = await this.db.query(referralQuery, [customer_id]);
    const referralData = referralResult.rows[0];

    const categorizePromotions = (promotions: CustomerPromotion[]) => ({
      active_promotions: promotions.filter(p => 
        p.status === 'active' && 
        new Date(p.valid_until) >= new Date() &&
        p.used_count < p.usage_limit
      ),
      expired_promotions: promotions.filter(p => 
        p.status === 'expired' || new Date(p.valid_until) < new Date()
      ),
      used_promotions: promotions.filter(p => 
        p.status === 'used' || p.used_count >= p.usage_limit
      )
    });

    const categorized = categorizePromotions(allPromotions);

    return {
      ...categorized,
      available_referral_rewards: {
        referral_code: referralData?.referral_code || '',
        referrer_reward: 50, // PHP 50 for each successful referral
        referred_reward: 100, // PHP 100 for new customers
        pending_referrals: parseInt(referralData?.pending_referrals) || 0,
        completed_referrals: parseInt(referralData?.completed_referrals) || 0
      }
    };
  }

  // Helper Methods
  private async processReferral(referral_code: string, referred_customer_id: string): Promise<void> {
    // Find the referral
    const referralQuery = `
      SELECT * FROM customer_referrals 
      WHERE referral_code = $1 AND status = 'pending'
    `;
    const referralResult = await this.db.query(referralQuery, [referral_code]);

    if (referralResult.rows.length === 0) {
      throw new Error('Invalid or expired referral code');
    }

    const referral = referralResult.rows[0];

    // Update referral status
    await this.db.query(`
      UPDATE customer_referrals 
      SET referred_customer_id = $1, status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [referred_customer_id, referral.id]);

    // Award points to referrer
    await this.awardLoyaltyPoints(
      referral.referrer_customer_id,
      referral.referrer_reward,
      'Referral bonus',
      null,
      null
    );
  }

  private async createWelcomePromotion(customer_id: string, has_referral: boolean): Promise<CustomerPromotion> {
    const discount_value = has_referral ? 100 : 50; // Higher discount for referred customers
    
    const query = `
      INSERT INTO customer_promotions (
        customer_id, promotion_code, promotion_name, promotion_type,
        discount_value, minimum_fare, usage_limit, valid_from, valid_until,
        terms_conditions, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      customer_id,
      `WELCOME${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      'Welcome Bonus',
      'fixed_amount',
      discount_value,
      100, // Minimum PHP 100 fare
      1, // Single use
      new Date().toISOString(),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      'Valid for new customers only. Cannot be combined with other offers.',
      'active'
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  private async generateCustomerReferralCode(customer_id: string): Promise<string> {
    const referral_code = `REF${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    await this.db.query(`
      INSERT INTO customer_referrals (
        referrer_customer_id, referral_code, status, 
        referrer_reward, referred_reward, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      customer_id,
      referral_code,
      'pending',
      50, // Referrer gets PHP 50
      100, // Referred gets PHP 100
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry
    ]);

    return referral_code;
  }

  private async awardLoyaltyPoints(
    customer_id: string, 
    points: number, 
    description: string,
    ride_id?: string | null,
    promotion_id?: string | null
  ): Promise<void> {
    await this.db.query(`
      INSERT INTO customer_loyalty_points (
        customer_id, transaction_type, points, description, ride_id, promotion_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [customer_id, 'earned', points, description, ride_id, promotion_id]);
  }

  private async addTicketMessage(
    ticket_id: string,
    sender_id: string,
    sender_type: string,
    message: string,
    attachments: any[] = [],
    is_internal: boolean = false
  ): Promise<void> {
    await this.db.query(`
      INSERT INTO support_ticket_messages (
        ticket_id, sender_id, sender_type, message, attachments, is_internal
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [ticket_id, sender_id, sender_type, message, JSON.stringify(attachments), is_internal]);
  }

  private async updateDriverAverageRating(driver_id: string): Promise<void> {
    // This is a simplified version - in production you'd have more sophisticated rating calculations
    const query = `
      UPDATE drivers 
      SET rating = (
        SELECT COALESCE(AVG(overall_rating), 0) 
        FROM customer_ride_ratings 
        WHERE driver_id = $1
      )
      WHERE id = $1
    `;
    
    await this.db.query(query, [driver_id]);
  }

  // Utility methods for admin/support
  async getCustomerSummary(customer_id: string): Promise<CustomerSummary | null> {
    const query = 'SELECT * FROM customer_summary WHERE id = $1';
    const result = await this.db.query(query, [customer_id]);
    return result.rows[0] || null;
  }

  async searchCustomers(filters: {
    query?: string;
    status?: string;
    verification_status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ customers: CustomerSummary[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (filters.query) {
      conditions.push(`(first_name ILIKE $${++paramCount} OR last_name ILIKE $${++paramCount} OR email ILIKE $${++paramCount} OR customer_number ILIKE $${++paramCount})`);
      const searchTerm = `%${filters.query}%`;
      values.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters.status) {
      conditions.push(`status = $${++paramCount}`);
      values.push(filters.status);
    }

    if (filters.verification_status) {
      conditions.push(`verification_status = $${++paramCount}`);
      values.push(filters.verification_status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM customer_summary ${whereClause}`;
    const countResult = await this.db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const dataQuery = `
      SELECT * FROM customer_summary 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    values.push(limit, offset);

    const dataResult = await this.db.query(dataQuery, values);

    return {
      customers: dataResult.rows,
      total
    };
  }
}