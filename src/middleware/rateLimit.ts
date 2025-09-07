import rateLimit from "express-rate-limit";

// Environment-aware rate limiting configuration
const enabled = String(process.env.RATE_LIMIT_ENABLED || "false") === "true";
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000); // 1 minute default
const max = Number(process.env.RATE_LIMIT_MAX || 0); // 0 = unlimited

console.log(`🛡️  Rate limiting: ${enabled ? 'ENABLED' : 'DISABLED'} (${max} req/${windowMs}ms)`);

// Export rate limit middleware
export const useRateLimit = enabled && max > 0
  ? rateLimit({
      windowMs,
      max,
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      
      // Customize error response
      message: {
        type: "https://httpstatuses.com/429",
        title: "Too Many Requests",
        status: 429,
        detail: `Rate limit exceeded. Try again in ${Math.ceil(windowMs / 1000)} seconds.`,
        instance: process.env.NODE_ENV || "unknown"
      },
      
      // Skip successful requests in some environments
      skipSuccessfulRequests: process.env.NODE_ENV === "production",
      
      // Skip failed requests to prevent abuse
      skipFailedRequests: false,
      
      // Custom key generator (could use IP, user ID, etc.)
      keyGenerator: (req: any) => {
        // Use user ID if authenticated, otherwise IP
        return req.user?.id || req.ip;
      },
      
      // Custom skip function
      skip: (req: any) => {
        // Skip rate limiting for health checks
        return req.path === '/api/health' || req.path === '/api/status';
      }
    })
  : // Pass-through middleware when rate limiting is disabled
    (_req: any, _res: any, next: any) => {
      next();
    };

// Export configuration for testing
export const rateLimitConfig = {
  enabled,
  windowMs,
  max,
  environment: process.env.NODE_ENV || "unknown"
};