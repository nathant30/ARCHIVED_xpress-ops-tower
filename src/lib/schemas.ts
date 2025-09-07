import { z } from "zod";

export const DriverQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().uuid().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  search: z.string().optional(),
});

export const DriverParamsSchema = z.object({
  id: z.string().uuid(),
});

export const DriverUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().regex(/^\+?[0-9]{8,15}$/).optional(),
  email: z.string().email().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
}).refine(data => Object.keys(data).length > 0, "At least one field is required to update");

export const RegionParamsSchema = z.object({
  id: z.string().uuid(),
});

export const RegionAssignmentSchema = z.object({
  driverId: z.string().uuid(),
  assignedBy: z.string().uuid(),
});