/**
 * Express Ops Tower - Real-time Pricing API
 * GET /api/v1/pricing/quote - Core pricing endpoint
 * Based on PRD v1.0 - September 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dynamicPricingEngine, type PricingRequest } from '@/lib/pricing/dynamic-pricing-engine';

// ============================================================================
// REQUEST VALIDATION SCHEMA
// ============================================================================

const PricingQuoteSchema = z.object({
  service_type: z.enum(['tnvs_standard', 'tnvs_premium', 'taxi_regular', 'taxi_premium', 'mc_taxi']),
  pickup_lat: z.number().min(-90).max(90),
  pickup_lng: z.number().min(-180).max(180),
  dropoff_lat: z.number().min(-90).max(90),
  dropoff_lng: z.number().min(-180).max(180),
  estimated_distance_km: z.number().min(0).max(1000),
  estimated_duration_min: z.number().min(0).max(600),
  timestamp: z.string().datetime(),
  user_id: z.string().uuid().optional(),
  driver_id: z.string().uuid().optional(),
  
  // Optional parameters for advanced pricing
  vehicle_class: z.enum(['economy', 'premium', 'luxury']).optional(),
  rider_tier: z.enum(['regular', 'silver', 'gold', 'platinum']).optional(),
  booking_type: z.enum(['immediate', 'scheduled', 'recurring']).optional(),
  special_requests: z.array(z.string()).optional(),
});

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/pricing/quote - Get real-time price quote
 * 
 * This is the core pricing endpoint that processes pricing requests
 * in real-time with <100ms target response time.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse and validate request
    const body = await request.json();
    const validatedRequest = PricingQuoteSchema.parse(body);
    
    // Rate limiting check (simplified)
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    if (!await isRateLimitOk(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before making another request.' },
        { status: 429 }
      );
    }
    
    // Fraud detection (simplified)
    const fraudCheck = await performFraudCheck(validatedRequest, clientIP);
    if (fraudCheck.isSuspicious) {
      return NextResponse.json(
        { error: 'Request flagged for review. Please contact support.' },
        { status: 403 }
      );
    }
    
    // Core pricing calculation
    const pricingRequest: PricingRequest = {
      service_type: validatedRequest.service_type,
      pickup_lat: validatedRequest.pickup_lat,
      pickup_lng: validatedRequest.pickup_lng,
      dropoff_lat: validatedRequest.dropoff_lat,
      dropoff_lng: validatedRequest.dropoff_lng,
      estimated_distance_km: validatedRequest.estimated_distance_km,
      estimated_duration_min: validatedRequest.estimated_duration_min,
      timestamp: validatedRequest.timestamp,
      user_id: validatedRequest.user_id,
      driver_id: validatedRequest.driver_id
    };
    
    const pricingResponse = await dynamicPricingEngine.calculatePrice(pricingRequest);
    
    // Add performance metadata
    const processingTime = Date.now() - startTime;
    const enhancedResponse = {
      ...pricingResponse,
      metadata: {
        processing_time_ms: processingTime,
        api_version: 'v1.0',
        timestamp: new Date().toISOString(),
        quote_valid_until: pricingResponse.expires_at
      }
    };
    
    // Log successful request for analytics
    await logPricingRequest(validatedRequest, enhancedResponse, {
      processing_time_ms: processingTime,
      client_ip: clientIP,
      user_agent: request.headers.get('user-agent') || 'unknown'
    });
    
    return NextResponse.json(enhancedResponse);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: error.errors,
          metadata: {
            processing_time_ms: processingTime,
            api_version: 'v1.0',
            timestamp: new Date().toISOString()
          }
        },
        { status: 400 }
      );
    }
    
    console.error('Pricing API error:', error);
    
    // Return generic error to client, log detailed error internally
    return NextResponse.json(
      {
        error: 'Internal server error. Please try again.',
        metadata: {
          processing_time_ms: processingTime,
          api_version: 'v1.0',
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/pricing/quote/[quote_id] - Retrieve existing quote
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { quote_id: string } }
) {
  try {
    const quoteId = params.quote_id;
    
    if (!quoteId || typeof quoteId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid quote ID' },
        { status: 400 }
      );
    }
    
    // Retrieve quote from database
    const quote = await retrieveQuote(quoteId);
    
    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found or expired' },
        { status: 404 }
      );
    }
    
    // Check if quote has expired
    const isExpired = new Date() > new Date(quote.expires_at);
    if (isExpired) {
      return NextResponse.json(
        { error: 'Quote has expired. Please request a new quote.' },
        { status: 410 } // Gone
      );
    }
    
    return NextResponse.json(quote);
    
  } catch (error) {
    console.error('Quote retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve quote' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simple rate limiting check
 */
async function isRateLimitOk(clientIP: string): Promise<boolean> {
  // In production, this would use Redis or similar for rate limiting
  // For now, we'll implement a simple in-memory rate limiter
  
  const rateLimit = rateInitMap.get(clientIP) || { count: 0, resetTime: Date.now() + 60000 };
  
  // Reset counter every minute
  if (Date.now() > rateLimit.resetTime) {
    rateLimit.count = 0;
    rateLimit.resetTime = Date.now() + 60000;
  }
  
  rateLimit.count++;
  rateInitMap.set(clientIP, rateLimit);
  
  // Allow 100 requests per minute per IP
  return rateLimit.count <= 100;
}

/**
 * Fraud detection checks
 */
async function performFraudCheck(
  request: z.infer<typeof PricingQuoteSchema>,
  clientIP: string
): Promise<{ isSuspicious: boolean; reasons: string[] }> {
  const reasons: string[] = [];
  let isSuspicious = false;
  
  // Check for impossible distances/times
  const speedKmh = (request.estimated_distance_km / request.estimated_duration_min) * 60;
  if (speedKmh > 200) { // Impossible speed
    reasons.push('Impossible travel speed detected');
    isSuspicious = true;
  }
  
  // Check for duplicate requests from same IP
  const recentRequests = recentRequestMap.get(clientIP) || [];
  const duplicateThreshold = 5; // 5 identical requests in 1 minute
  const now = Date.now();
  
  // Clean old requests
  const validRequests = recentRequests.filter(r => now - r.timestamp < 60000);
  
  // Check for duplicates
  const requestKey = `${request.pickup_lat},${request.pickup_lng},${request.dropoff_lat},${request.dropoff_lng}`;
  const duplicateCount = validRequests.filter(r => r.key === requestKey).length;
  
  if (duplicateCount >= duplicateThreshold) {
    reasons.push('Suspicious request pattern detected');
    isSuspicious = true;
  }
  
  // Add current request to tracking
  validRequests.push({ key: requestKey, timestamp: now });
  recentRequestMap.set(clientIP, validRequests);
  
  // Check for location spoofing (basic check)
  if (Math.abs(request.pickup_lat - request.dropoff_lat) < 0.0001 && 
      Math.abs(request.pickup_lng - request.dropoff_lng) < 0.0001) {
    if (request.estimated_distance_km > 0.1) {
      reasons.push('Potential GPS spoofing detected');
      isSuspicious = true;
    }
  }
  
  return { isSuspicious, reasons };
}

/**
 * Retrieve quote from storage
 */
async function retrieveQuote(quoteId: string): Promise<any> {
  // In production, this would query the pricing_decisions table
  // For now, return null to indicate quote not found
  return null;
}

/**
 * Log pricing request for analytics
 */
async function logPricingRequest(
  request: z.infer<typeof PricingQuoteSchema>,
  response: any,
  metadata: any
): Promise<void> {
  try {
    // In production, this would insert into pricing_analytics table
    console.log('Pricing request logged:', {
      quote_id: response.quote_id,
      service_type: request.service_type,
      total_fare: response.total_fare,
      surge_multiplier: response.surge_multiplier,
      processing_time: metadata.processing_time_ms,
      client_ip: metadata.client_ip,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log pricing request:', error);
  }
}

// ============================================================================
// IN-MEMORY STORAGE (FOR DEVELOPMENT)
// ============================================================================

// Simple in-memory storage for rate limiting and fraud detection
// In production, this would be replaced with Redis or similar
const rateInitMap = new Map<string, { count: number; resetTime: number }>();
const recentRequestMap = new Map<string, Array<{ key: string; timestamp: number }>>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  
  // Clean rate limit map
  for (const [ip, data] of rateInitMap.entries()) {
    if (now > data.resetTime) {
      rateInitMap.delete(ip);
    }
  }
  
  // Clean recent requests map
  for (const [ip, requests] of recentRequestMap.entries()) {
    const validRequests = requests.filter(r => now - r.timestamp < 60000);
    if (validRequests.length === 0) {
      recentRequestMap.delete(ip);
    } else {
      recentRequestMap.set(ip, validRequests);
    }
  }
}, 60000); // Clean every minute