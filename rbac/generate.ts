import { writeFileSync, mkdirSync } from "fs";
import { PERMISSIONS, BUILTIN_ROLES } from "./permissions";

mkdirSync("artifacts", { recursive: true });
writeFileSync("artifacts/permissions.json", JSON.stringify({ permissions: PERMISSIONS }, null, 2));
writeFileSync("artifacts/roles.json", JSON.stringify(BUILTIN_ROLES, null, 2));
console.log("✓ Generated artifacts/permissions.json and roles.json");
