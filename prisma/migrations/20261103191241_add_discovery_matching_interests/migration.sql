-- CreateEnum
CREATE TYPE "InterestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED');

-- CreateTable
CREATE TABLE "profile_shortlists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "target_profile_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_shortlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matrimonial_interests" (
    "id" TEXT NOT NULL,
    "sender_profile_id" TEXT NOT NULL,
    "recipient_profile_id" TEXT NOT NULL,
    "status" "InterestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matrimonial_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mutual_matches" (
    "id" TEXT NOT NULL,
    "profile1_id" TEXT NOT NULL,
    "profile2_id" TEXT NOT NULL,
    "matched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interest_id" TEXT,

    CONSTRAINT "mutual_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profile_shortlists_profile_id_idx" ON "profile_shortlists"("profile_id");

-- CreateIndex
CREATE INDEX "profile_shortlists_target_profile_id_idx" ON "profile_shortlists"("target_profile_id");

-- CreateIndex
CREATE INDEX "profile_shortlists_user_id_idx" ON "profile_shortlists"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_shortlists_profile_id_target_profile_id_key" ON "profile_shortlists"("profile_id", "target_profile_id");

-- CreateIndex
CREATE INDEX "matrimonial_interests_sender_profile_id_status_idx" ON "matrimonial_interests"("sender_profile_id", "status");

-- CreateIndex
CREATE INDEX "matrimonial_interests_recipient_profile_id_status_idx" ON "matrimonial_interests"("recipient_profile_id", "status");

-- CreateIndex
CREATE INDEX "matrimonial_interests_sender_profile_id_created_at_idx" ON "matrimonial_interests"("sender_profile_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "matrimonial_interests_sender_profile_id_recipient_profile_i_key" ON "matrimonial_interests"("sender_profile_id", "recipient_profile_id");

-- CreateIndex
CREATE INDEX "mutual_matches_profile1_id_idx" ON "mutual_matches"("profile1_id");

-- CreateIndex
CREATE INDEX "mutual_matches_profile2_id_idx" ON "mutual_matches"("profile2_id");

-- CreateIndex
CREATE UNIQUE INDEX "mutual_matches_profile1_id_profile2_id_key" ON "mutual_matches"("profile1_id", "profile2_id");

-- AddForeignKey
ALTER TABLE "profile_shortlists" ADD CONSTRAINT "profile_shortlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_shortlists" ADD CONSTRAINT "profile_shortlists_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "matrimonial_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_shortlists" ADD CONSTRAINT "profile_shortlists_target_profile_id_fkey" FOREIGN KEY ("target_profile_id") REFERENCES "matrimonial_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrimonial_interests" ADD CONSTRAINT "matrimonial_interests_sender_profile_id_fkey" FOREIGN KEY ("sender_profile_id") REFERENCES "matrimonial_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matrimonial_interests" ADD CONSTRAINT "matrimonial_interests_recipient_profile_id_fkey" FOREIGN KEY ("recipient_profile_id") REFERENCES "matrimonial_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutual_matches" ADD CONSTRAINT "mutual_matches_profile1_id_fkey" FOREIGN KEY ("profile1_id") REFERENCES "matrimonial_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutual_matches" ADD CONSTRAINT "mutual_matches_profile2_id_fkey" FOREIGN KEY ("profile2_id") REFERENCES "matrimonial_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutual_matches" ADD CONSTRAINT "mutual_matches_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "matrimonial_interests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
