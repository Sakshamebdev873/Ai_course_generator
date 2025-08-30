-- CreateTable
CREATE TABLE "public"."BlacklistedToken" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlacklistedToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistedToken_jti_key" ON "public"."BlacklistedToken"("jti");
