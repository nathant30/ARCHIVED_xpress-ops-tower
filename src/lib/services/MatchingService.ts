import { DatabaseService } from './DatabaseService';
import {
  DriverAvailability,
  RideMatchingRequest,
  DriverMatchingCandidate,
  DriverRideResponse,
  MatchingQueue,
  FindDriverRequest,
  FindDriverResponse,
  DriverAvailabilityResponse,
  AcceptRideRequest,
  AcceptRideResponse,
  RejectRideRequest,
  RejectRideResponse,
  QueueStatusResponse,
  MatchingAlgorithmConfig
} from '@/types/matching';

export class MatchingService {
  private db: DatabaseService;
  private algorithmConfig: MatchingAlgorithmConfig;

  constructor() {
    this.db = new DatabaseService();
    this.algorithmConfig = {
      version: 'v3.2',
      weights: {
        distance: 0.4,
        time: 0.3,
        rating: 0.15,
        acceptance_rate: 0.1,
        completion_rate: 0.05
      },
      thresholds: {
        max_distance_meters: 5000,
        max_eta_seconds: 900,
        min_driver_rating: 4.0,
        min_acceptance_rate: 0.75
      },
      surge_factors: {
        demand_threshold: 1.5,
        max_multiplier: 3.0,
        zone_specific: true
      }
    };
  }

  async findDriver(request: FindDriverRequest): Promise<FindDriverResponse> {
    try {
      // Create matching request record
      const matchingRequest = await this.createMatchingRequest(request);
      
      // Find available drivers
      const candidates = await this.findDriverCandidates(matchingRequest);
      
      // Score and rank candidates
      const scoredCandidates = await this.scoreDriverCandidates(candidates, matchingRequest);
      
      // Add to matching queue
      const queueEntry = await this.addToMatchingQueue(matchingRequest, scoredCandidates);
      
      // Get best match
      const bestMatch = scoredCandidates.length > 0 ? scoredCandidates[0] : null;
      
      // Calculate pricing
      const pricingEstimate = await this.calculatePricingEstimate(matchingRequest, bestMatch);

      return {
        request_id: matchingRequest.id,
        status: candidates.length > 0 ? 'matching' : 'no_drivers_available',
        queue_position: queueEntry.queue_position,
        estimated_match_time: this.calculateEstimatedMatchTime(scoredCandidates.length).toISOString(),
        candidates_found: candidates.length,
        best_match: bestMatch ? {
          driver_id: bestMatch.driver_id,
          driver_name: await this.getDriverName(bestMatch.driver_id),
          vehicle_info: await this.getVehicleInfo(bestMatch.driver_id),
          rating: bestMatch.driver_rating || 4.5,
          distance_meters: bestMatch.distance_meters,
          eta_seconds: bestMatch.eta_seconds,
          score: bestMatch.score
        } : undefined,
        pricing_estimate: pricingEstimate
      };
    } catch (error) {
      console.error('Driver matching error:', error);
      throw new Error('Failed to find driver');
    }
  }

  async getDriverAvailability(regionId?: string, radius?: number): Promise<DriverAvailabilityResponse> {
    try {
      const query = `
        SELECT 
          da.*,
          d.name as driver_name,
          v.make, v.model, v.license_plate,
          EXTRACT(EPOCH FROM (NOW() - da.last_ping))::INTEGER as seconds_since_ping
        FROM driver_availability da
        JOIN drivers d ON d.id = da.driver_id
        LEFT JOIN vehicles v ON v.id = d.vehicle_id
        WHERE da.status IN ('online', 'available')
          AND da.last_ping > NOW() - INTERVAL '5 minutes'
          ${regionId ? 'AND da.preferred_zone_id = $1' : ''}
        ORDER BY da.last_ping DESC
      `;

      const params = regionId ? [regionId] : [];
      const result = await this.db.query(query, params);

      const drivers = result.rows.map(row => ({
        driver_id: row.driver_id,
        driver_name: row.driver_name,
        vehicle_info: `${row.make} ${row.model} (${row.license_plate})`,
        location: {
          latitude: parseFloat(row.location_latitude),
          longitude: parseFloat(row.location_longitude)
        },
        status: row.status,
        distance_meters: 0, // Would calculate based on reference point
        rating: 4.5, // Would get from driver ratings
        acceptance_rate: 0.85, // Would get from performance metrics
        last_ping: row.last_ping
      }));

      // Calculate zone coverage
      const zoneCoverage = await this.calculateZoneCoverage(drivers);

      return {
        drivers,
        total_online: drivers.length,
        total_available: drivers.filter(d => d.status === 'online').length,
        zone_coverage: zoneCoverage,
        summary: {
          average_distance: drivers.reduce((sum, d) => sum + d.distance_meters, 0) / drivers.length || 0,
          average_rating: drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length || 0,
          response_time_estimate: this.calculateResponseTimeEstimate(drivers.length)
        }
      };
    } catch (error) {
      console.error('Driver availability error:', error);
      throw new Error('Failed to get driver availability');
    }
  }

  async acceptRide(request: AcceptRideRequest): Promise<AcceptRideResponse> {
    try {
      // Record driver response
      const responseId = await this.recordDriverResponse(request.request_id, request.driver_id, 'accepted');
      
      // Create ride record
      const rideId = await this.createRideRecord(request);
      
      // Update matching queue
      await this.updateMatchingQueue(request.request_id, 'completed', request.driver_id);
      
      // Update driver status
      await this.updateDriverStatus(request.driver_id, 'busy');
      
      // Get customer contact info
      const customerContact = await this.getCustomerContact(request.request_id);
      
      // Calculate navigation and earnings
      const navigation = await this.generateNavigationData(request);
      const earningsEstimate = await this.calculateEarningsEstimate(request);

      return {
        response_id: responseId,
        status: 'accepted',
        ride_id: rideId,
        customer_contact: customerContact,
        navigation: navigation,
        earnings_estimate: earningsEstimate
      };
    } catch (error) {
      console.error('Accept ride error:', error);
      throw new Error('Failed to accept ride');
    }
  }

  async rejectRide(request: RejectRideRequest): Promise<RejectRideResponse> {
    try {
      // Record driver response
      const responseId = await this.recordDriverResponse(request.request_id, request.driver_id, 'rejected', request.rejection_reason);
      
      // Update driver performance metrics
      const impact = await this.updateDriverPerformance(request.driver_id, 'rejection');
      
      // Continue matching process for other drivers
      await this.continueMatching(request.request_id);

      return {
        response_id: responseId,
        status: 'rejected',
        impact: {
          acceptance_rate_change: impact.acceptance_rate_change,
          next_request_delay: impact.next_request_delay
        },
        feedback_requested: request.rejection_category === 'other'
      };
    } catch (error) {
      console.error('Reject ride error:', error);
      throw new Error('Failed to reject ride');
    }
  }

  async getQueueStatus(requestId: string): Promise<QueueStatusResponse> {
    try {
      // Get queue entry
      const queueResult = await this.db.query(`
        SELECT * FROM matching_queue 
        WHERE request_id = $1
      `, [requestId]);

      if (queueResult.rows.length === 0) {
        throw new Error('Request not found in queue');
      }

      const queue = queueResult.rows[0];

      // Get driver responses
      const responsesResult = await this.db.query(`
        SELECT 
          drr.*,
          EXTRACT(EPOCH FROM (drr.responded_at - mr.created_at))::INTEGER as response_time
        FROM driver_ride_responses drr
        JOIN ride_matching_requests mr ON mr.id = drr.request_id
        WHERE drr.request_id = $1
        ORDER BY drr.responded_at
      `, [requestId]);

      const responses = responsesResult.rows.map(row => ({
        driver_id: row.driver_id,
        response: row.response,
        response_time: row.response_time,
        rejection_reason: row.rejection_reason
      }));

      // Calculate next action
      const nextAction = await this.calculateNextAction(queue, responses);

      return {
        request_id: requestId,
        status: queue.status,
        queue_position: queue.queue_position,
        current_phase: queue.current_phase,
        drivers_contacted: queue.drivers_contacted,
        drivers_responded: responses.length,
        responses: responses,
        next_action: nextAction,
        timeout_info: {
          remaining_time: this.calculateRemainingTime(queue.assignment_deadline),
          max_attempts: 3,
          current_attempt: queue.timeout_attempts + 1
        }
      };
    } catch (error) {
      console.error('Queue status error:', error);
      throw new Error('Failed to get queue status');
    }
  }

  // Private helper methods
  private async createMatchingRequest(request: FindDriverRequest): Promise<RideMatchingRequest> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    const result = await this.db.query(`
      INSERT INTO ride_matching_requests (
        id, customer_id, pickup_location, destination_location, 
        vehicle_type, passenger_count, max_pickup_distance, 
        max_wait_time, surge_acceptance, status, priority_score, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      requestId, request.customer_id,
      JSON.stringify(request.pickup_location),
      JSON.stringify(request.destination_location),
      request.vehicle_type, request.passenger_count || 1,
      request.max_pickup_distance || 5000, request.max_wait_time || 300,
      request.surge_acceptance || false, 'pending', 100,
      new Date(Date.now() + 15 * 60 * 1000) // 15 minutes expiry
    ]);

    return result.rows[0];
  }

  private async findDriverCandidates(request: RideMatchingRequest): Promise<DriverAvailability[]> {
    const query = `
      SELECT da.*, 
        ST_Distance(
          ST_Point($1, $2)::geography,
          ST_Point(da.location_longitude, da.location_latitude)::geography
        ) as distance_meters
      FROM driver_availability da
      WHERE da.status = 'online'
        AND da.last_ping > NOW() - INTERVAL '2 minutes'
        AND da.vehicle_capacity >= $3
        AND ST_DWithin(
          ST_Point($1, $2)::geography,
          ST_Point(da.location_longitude, da.location_latitude)::geography,
          $4
        )
      ORDER BY distance_meters
      LIMIT 20
    `;

    const pickup = JSON.parse(request.pickup_location as any);
    const result = await this.db.query(query, [
      pickup.longitude, pickup.latitude,
      request.passenger_count,
      request.max_pickup_distance
    ]);

    return result.rows;
  }

  private async scoreDriverCandidates(
    candidates: DriverAvailability[], 
    request: RideMatchingRequest
  ): Promise<DriverMatchingCandidate[]> {
    const scored: DriverMatchingCandidate[] = [];

    for (const candidate of candidates) {
      // Get driver performance metrics
      const performance = await this.getDriverPerformance(candidate.driver_id);
      
      // Calculate individual scores
      const distanceScore = Math.max(0, 100 - (candidate.distance_meters / 50));
      const ratingScore = (performance.rating || 4.0) * 20;
      const acceptanceScore = (performance.acceptance_rate || 0.8) * 100;
      const completionScore = (performance.completion_rate || 0.9) * 100;
      
      // Weighted final score
      const finalScore = 
        distanceScore * this.algorithmConfig.weights.distance +
        ratingScore * this.algorithmConfig.weights.rating +
        acceptanceScore * this.algorithmConfig.weights.acceptance_rate +
        completionScore * this.algorithmConfig.weights.completion_rate;

      const matchCandidate: DriverMatchingCandidate = {
        id: `match_${Date.now()}_${candidate.id}`,
        request_id: request.id,
        driver_id: candidate.driver_id,
        score: Math.round(finalScore),
        distance_meters: candidate.distance_meters,
        eta_seconds: Math.round(candidate.distance_meters / 8.33), // ~30 km/h average
        driver_rating: performance.rating,
        acceptance_rate: performance.acceptance_rate,
        completion_rate: performance.completion_rate,
        response_time_avg: performance.response_time_avg,
        surge_multiplier: 1.0, // Would calculate based on demand
        match_quality: this.getMatchQuality(finalScore),
        rejection_reasons: [],
        algorithm_version: this.algorithmConfig.version,
        calculated_at: new Date().toISOString()
      };

      scored.push(matchCandidate);
    }

    return scored.sort((a, b) => b.score - a.score);
  }

  private async addToMatchingQueue(
    request: RideMatchingRequest, 
    candidates: DriverMatchingCandidate[]
  ): Promise<MatchingQueue> {
    const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const result = await this.db.query(`
      INSERT INTO matching_queue (
        id, request_id, queue_position, current_phase, 
        drivers_contacted, best_match_driver_id, best_match_score,
        assignment_deadline, algorithm_config, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      queueId, request.id, 1, 'broadcast', candidates.length,
      candidates[0]?.driver_id, candidates[0]?.score,
      new Date(Date.now() + 5 * 60 * 1000), // 5 minutes deadline
      JSON.stringify(this.algorithmConfig), 'active'
    ]);

    return result.rows[0];
  }

  private async calculatePricingEstimate(
    request: RideMatchingRequest, 
    bestMatch?: DriverMatchingCandidate
  ) {
    // Mock pricing calculation - in production would use pricing service
    const baseDistance = 5; // km estimate
    const baseFare = 50; // PHP
    const surgeMultiplier = bestMatch?.surge_multiplier || 1.0;
    
    return {
      base_fare: baseFare,
      surge_multiplier: surgeMultiplier,
      estimated_total: Math.round(baseFare * surgeMultiplier * (baseDistance / 5)),
      currency: 'PHP'
    };
  }

  // Additional helper methods
  private calculateEstimatedMatchTime(candidateCount: number): Date {
    const baseTime = candidateCount > 0 ? 30 : 120; // seconds
    return new Date(Date.now() + baseTime * 1000);
  }

  private async getDriverName(driverId: string): Promise<string> {
    const result = await this.db.query('SELECT name FROM drivers WHERE id = $1', [driverId]);
    return result.rows[0]?.name || 'Unknown Driver';
  }

  private async getVehicleInfo(driverId: string): Promise<string> {
    const result = await this.db.query(`
      SELECT v.make, v.model, v.license_plate 
      FROM vehicles v 
      JOIN drivers d ON d.vehicle_id = v.id 
      WHERE d.id = $1
    `, [driverId]);
    
    const vehicle = result.rows[0];
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})` : 'Vehicle Info Unavailable';
  }

  private async calculateZoneCoverage(drivers: any[]): Promise<Record<string, number>> {
    // Mock zone coverage calculation
    return {
      'Metro Manila': drivers.length * 0.6,
      'Quezon City': drivers.length * 0.3,
      'Makati': drivers.length * 0.1
    };
  }

  private calculateResponseTimeEstimate(driverCount: number): string {
    const minutes = Math.max(1, Math.ceil(10 / Math.sqrt(driverCount)));
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  private getMatchQuality(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  private async getDriverPerformance(driverId: string) {
    // Mock performance data - in production would query driver_performance_analytics
    return {
      rating: 4.2 + Math.random() * 0.8,
      acceptance_rate: 0.75 + Math.random() * 0.2,
      completion_rate: 0.85 + Math.random() * 0.1,
      response_time_avg: 30 + Math.random() * 60
    };
  }

  private async recordDriverResponse(
    requestId: string, 
    driverId: string, 
    response: string, 
    rejectionReason?: string
  ): Promise<string> {
    const responseId = `resp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    await this.db.query(`
      INSERT INTO driver_ride_responses (
        id, request_id, driver_id, response, rejection_reason, responded_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [responseId, requestId, driverId, response, rejectionReason]);

    return responseId;
  }

  private async createRideRecord(request: AcceptRideRequest): Promise<string> {
    const rideId = `ride_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    await this.db.query(`
      INSERT INTO rides (
        id, customer_id, driver_id, status, pickup_location, 
        destination_location, estimated_arrival_time, created_at
      ) VALUES ($1, 
        (SELECT customer_id FROM ride_matching_requests WHERE id = $2),
        $3, 'assigned', 
        (SELECT pickup_location FROM ride_matching_requests WHERE id = $2),
        (SELECT destination_location FROM ride_matching_requests WHERE id = $2),
        $4, NOW()
      )
    `, [rideId, request.request_id, request.driver_id, request.estimated_arrival_time]);

    return rideId;
  }

  private async updateMatchingQueue(requestId: string, status: string, driverId?: string) {
    await this.db.query(`
      UPDATE matching_queue 
      SET status = $2, best_match_driver_id = COALESCE($3, best_match_driver_id),
          updated_at = NOW()
      WHERE request_id = $1
    `, [requestId, status, driverId]);
  }

  private async updateDriverStatus(driverId: string, status: string) {
    await this.db.query(`
      UPDATE driver_availability 
      SET status = $2, updated_at = NOW()
      WHERE driver_id = $1
    `, [driverId, status]);
  }

  private async getCustomerContact(requestId: string) {
    // Mock customer contact - in production would get from customers table
    return {
      phone: '+63917*******',
      pickup_instructions: 'Near the main entrance'
    };
  }

  private async generateNavigationData(request: AcceptRideRequest) {
    // Mock navigation data - would integrate with mapping service
    return {
      pickup_coordinates: request.current_location,
      estimated_route: { distance: '2.5 km', duration: '8 mins' },
      traffic_alerts: ['Light traffic on EDSA', 'Construction on Shaw Blvd']
    };
  }

  private async calculateEarningsEstimate(request: AcceptRideRequest) {
    // Mock earnings calculation
    return {
      base_fare: 85,
      commission_rate: 0.25,
      estimated_earnings: 64
    };
  }

  private async updateDriverPerformance(driverId: string, action: string) {
    // Mock performance impact calculation
    return {
      acceptance_rate_change: action === 'rejection' ? -0.02 : 0,
      next_request_delay: action === 'rejection' ? 60 : 0 // seconds
    };
  }

  private async continueMatching(requestId: string) {
    // Continue matching process with next available drivers
    console.log(`Continuing matching process for request ${requestId}`);
  }

  private async calculateNextAction(queue: any, responses: any[]) {
    const hasAcceptance = responses.some(r => r.response === 'accepted');
    
    if (hasAcceptance) {
      return {
        action: 'assign_driver',
        estimated_time: 'immediate'
      };
    }

    if (queue.drivers_contacted > queue.drivers_responded) {
      return {
        action: 'wait_for_responses',
        estimated_time: '30 seconds'
      };
    }

    return {
      action: 'expand_search',
      estimated_time: '1 minute'
    };
  }

  private calculateRemainingTime(deadline: string): number {
    return Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000));
  }
}