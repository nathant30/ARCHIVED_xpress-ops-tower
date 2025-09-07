-- CreateTable
CREATE TABLE "ApiEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "operation" TEXT,
    "params" JSONB,
    "query" JSONB,
    "body" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ApiEvent_method_path_createdAt_idx" ON "ApiEvent"("method", "path", "createdAt");
