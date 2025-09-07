// Unified error handler with RFC 7807 format
export function handleError(err, req, res, next) {
  const correlationId = req.correlationId;
  
  // Log error with correlation ID
  console.error(`[${correlationId}] Error:`, err);
  
  // Determine error type and status
  let status = 500;
  let type = "about:blank";
  let title = "Internal Server Error";
  let detail = "An unexpected error occurred";
  
  if (err.name === 'ValidationError') {
    status = 400;
    type = "https://tools.ietf.org/html/rfc7231#section-6.5.1";
    title = "Validation Failed";
    detail = err.message;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    type = "https://tools.ietf.org/html/rfc7235#section-3.1";
    title = "Unauthorized";
    detail = "Invalid or missing authentication";
  }
  
  // RFC 7807 Problem Details format
  res.status(status).json({
    type,
    title, 
    status,
    detail,
    instance: req.originalUrl,
    correlationId
  });
}