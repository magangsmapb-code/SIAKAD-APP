-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DEVELOPER';

-- CreateEnum
CREATE TYPE "FeatureImplementationStatus" AS ENUM ('IMPLEMENTED', 'IN_PROGRESS', 'NOT_IMPLEMENTED');

-- CreateEnum
CREATE TYPE "FeatureMaintenanceStatus" AS ENUM ('ACTIVE', 'MAINTENANCE');

-- CreateTable
CREATE TABLE IF NOT EXISTS "feature_registries" (
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "implementationStatus" "FeatureImplementationStatus" NOT NULL DEFAULT 'IMPLEMENTED',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceStatus" "FeatureMaintenanceStatus" NOT NULL DEFAULT 'ACTIVE',
    "maintenanceMessage" TEXT,
    "requiredPermissions" TEXT[],
    "dependencies" TEXT[],
    "updatedById" TEXT,
    "updatedByName" TEXT,
    "lastChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_registries_pkey" PRIMARY KEY ("key")
);
