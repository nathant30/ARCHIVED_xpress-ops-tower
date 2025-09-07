// Idempotency middleware for mutations
import { prisma } from '@/lib/prisma';

export function requireIdempotency(req, res, next) {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();
  
  const key = req.header("Idempotency-Key");
  if (!key) {
    return res.status(400).json({
      type: "https://tools.ietf.org/html/rfc7231#section-6.5.1",
      title: "Missing Idempotency Key",
      status: 400,
      detail: "Idempotency-Key header required for mutation operations"
    });
  }
  
  // Store key for downstream processing
  req.idempotencyKey = key;
  next();
}