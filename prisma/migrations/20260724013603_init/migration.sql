-- CreateEnum
CREATE TYPE "DrinkPreferenceKind" AS ENUM ('BEER_STYLE', 'WINE_STYLE', 'NON_ALC');

-- CreateEnum
CREATE TYPE "VenueType" AS ENUM ('BREWERY', 'TAPROOM', 'BEER_GARDEN', 'BREWPUB', 'WINE_BAR', 'TASTING_ROOM', 'BOTTLE_SHOP');

-- CreateEnum
CREATE TYPE "NoiseLevel" AS ENUM ('QUIET', 'MODERATE', 'LOUD');

-- CreateEnum
CREATE TYPE "VenueOutreachStatus" AS ENUM ('PROSPECT', 'CONTACTED', 'PARTNERED', 'DECLINED');

-- CreateEnum
CREATE TYPE "GroupKind" AS ENUM ('INDUSTRY', 'SOCIAL', 'ACTIVITY');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('ACTIVE', 'DORMANT');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('MEMBER', 'HOST', 'ADMIN');

-- CreateEnum
CREATE TYPE "SeriesCadence" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('OPEN', 'FULL', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('GOING', 'WAITLIST', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LastCallResponseStatus" AS ENUM ('COMING', 'MAYBE', 'DECLINED');

-- CreateEnum
CREATE TYPE "XpEventKind" AS ENUM ('HOSTED_ROUND', 'ROUND_FILLED', 'REPEAT_ATTENDEE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "emailDomain" TEXT,
    "name" TEXT,
    "image" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "city" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "ageAttestedAt" TIMESTAMP(3),
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "DrinkPreference" (
    "userId" TEXT NOT NULL,
    "kind" "DrinkPreferenceKind" NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "DrinkPreference_pkey" PRIMARY KEY ("userId","kind","value")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "venueType" "VenueType" NOT NULL,
    "noiseLevel" "NoiseLevel" NOT NULL,
    "hasFlights" BOOLEAN NOT NULL DEFAULT false,
    "hasCommunalTables" BOOLEAN NOT NULL DEFAULT false,
    "hasOutdoorSeating" BOOLEAN NOT NULL DEFAULT false,
    "isDogFriendly" BOOLEAN NOT NULL DEFAULT false,
    "hasFood" BOOLEAN NOT NULL DEFAULT false,
    "acceptsLargeGroups" BOOLEAN NOT NULL DEFAULT false,
    "typicalPourPrice" DOUBLE PRECISION,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "notes" TEXT,
    "outreachStatus" "VenueOutreachStatus" NOT NULL DEFAULT 'PROSPECT',
    "outreachNotes" TEXT,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "kind" "GroupKind" NOT NULL,
    "createdByUserId" TEXT,
    "status" "GroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastRoundAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundTag" (
    "roundId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "RoundTag_pkey" PRIMARY KEY ("roundId","tagId")
);

-- CreateTable
CREATE TABLE "TagFollow" (
    "userId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TagFollow_pkey" PRIMARY KEY ("userId","tagId")
);

-- CreateTable
CREATE TABLE "RoundSeries" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "cadence" "SeriesCadence" NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "timeOfDay" TEXT NOT NULL,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoundSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "venueId" TEXT,
    "locationText" TEXT,
    "seriesId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "isFlightFocused" BOOLEAN NOT NULL DEFAULT false,
    "status" "RoundStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rsvp" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RsvpStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedByUserId" TEXT NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Edge" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "roundCount" INTEGER NOT NULL DEFAULT 0,
    "firstMetAt" TIMESTAMP(3) NOT NULL,
    "lastMetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Edge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LastCall" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "venueId" TEXT,
    "locationText" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LastCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LastCallResponse" (
    "id" TEXT NOT NULL,
    "lastCallId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "LastCallResponseStatus" NOT NULL,

    CONSTRAINT "LastCallResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XpEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "XpEventKind" NOT NULL,
    "points" INTEGER NOT NULL,
    "roundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueOffer" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "terms" TEXT NOT NULL,
    "minPartySize" INTEGER NOT NULL,
    "validDays" JSONB NOT NULL,
    "validFromHour" INTEGER NOT NULL,
    "validToHour" INTEGER NOT NULL,
    "startsOn" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VenueOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_slug_key" ON "Venue"("slug");

-- CreateIndex
CREATE INDEX "Venue_city_idx" ON "Venue"("city");

-- CreateIndex
CREATE UNIQUE INDEX "Group_slug_key" ON "Group"("slug");

-- CreateIndex
CREATE INDEX "Group_status_idx" ON "Group"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMembership_userId_groupId_key" ON "GroupMembership"("userId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "RoundTag_tagId_idx" ON "RoundTag"("tagId");

-- CreateIndex
CREATE INDEX "Round_startsAt_idx" ON "Round"("startsAt");

-- CreateIndex
CREATE INDEX "Round_groupId_idx" ON "Round"("groupId");

-- CreateIndex
CREATE INDEX "Round_seriesId_idx" ON "Round"("seriesId");

-- CreateIndex
CREATE INDEX "Rsvp_roundId_idx" ON "Rsvp"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "Rsvp_roundId_userId_key" ON "Rsvp"("roundId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_roundId_userId_key" ON "Attendance"("roundId", "userId");

-- CreateIndex
CREATE INDEX "Edge_userAId_idx" ON "Edge"("userAId");

-- CreateIndex
CREATE INDEX "Edge_userBId_idx" ON "Edge"("userBId");

-- CreateIndex
CREATE UNIQUE INDEX "Edge_userAId_userBId_key" ON "Edge"("userAId", "userBId");

-- CreateIndex
CREATE INDEX "LastCall_expiresAt_idx" ON "LastCall"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "LastCallResponse_lastCallId_userId_key" ON "LastCallResponse"("lastCallId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "XpEvent_userId_kind_roundId_key" ON "XpEvent"("userId", "kind", "roundId");

-- CreateIndex
CREATE INDEX "VenueOffer_venueId_idx" ON "VenueOffer"("venueId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrinkPreference" ADD CONSTRAINT "DrinkPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundTag" ADD CONSTRAINT "RoundTag_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundTag" ADD CONSTRAINT "RoundTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagFollow" ADD CONSTRAINT "TagFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagFollow" ADD CONSTRAINT "TagFollow_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundSeries" ADD CONSTRAINT "RoundSeries_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundSeries" ADD CONSTRAINT "RoundSeries_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundSeries" ADD CONSTRAINT "RoundSeries_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "RoundSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edge" ADD CONSTRAINT "Edge_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edge" ADD CONSTRAINT "Edge_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LastCall" ADD CONSTRAINT "LastCall_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LastCall" ADD CONSTRAINT "LastCall_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LastCallResponse" ADD CONSTRAINT "LastCallResponse_lastCallId_fkey" FOREIGN KEY ("lastCallId") REFERENCES "LastCall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LastCallResponse" ADD CONSTRAINT "LastCallResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpEvent" ADD CONSTRAINT "XpEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpEvent" ADD CONSTRAINT "XpEvent_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueOffer" ADD CONSTRAINT "VenueOffer_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
