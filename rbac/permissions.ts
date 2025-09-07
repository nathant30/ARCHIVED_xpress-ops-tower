export const PERMISSIONS = [
  "rides.view",
  "rides.edit",
  "pricing.configure",
  "fraud.review",
  "operators.manage",
  "users.manage",
  "compliance.view",
  "compliance.edit",
  "query_curated_views",
  "view_ops_kpis_masked"
] as const;

export type Permission = typeof PERMISSIONS[number];

export const BUILTIN_ROLES: Record<string, Permission[]> = {
  ground_ops: ["rides.view", "fraud.review", "query_curated_views"],
  support: ["rides.view", "users.manage"],
  executive: ["rides.view", "pricing.configure", "compliance.view", "view_ops_kpis_masked"],
  iam_admin: ["users.manage", "operators.manage", "compliance.edit"]
};
