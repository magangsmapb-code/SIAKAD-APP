ALTER TYPE "AttendanceMethod" ADD VALUE IF NOT EXISTS 'SELF_MOBILE';

CREATE TABLE IF NOT EXISTS "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "role_permissions_role_permissionKey_key"
    ON "role_permissions"("role", "permissionKey");
CREATE INDEX IF NOT EXISTS "role_permissions_permissionKey_idx"
    ON "role_permissions"("permissionKey");
