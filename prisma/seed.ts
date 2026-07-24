import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  DrinkPreferenceKind,
  VenueType,
  NoiseLevel,
  GroupKind,
  GroupStatus,
  MembershipRole,
  RoundStatus,
  RsvpStatus,
} from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return daysFromNow(-days);
}

async function main() {
  // ---------- Users ----------
  const usersData = [
    { displayName: "Alex Kim", email: "alex.kim@example.com", city: "Silver Spring", isAdmin: true },
    { displayName: "Priya Patel", email: "priya.patel@example.com", city: "Silver Spring" },
    { displayName: "Jordan Lee", email: "jordan.lee@example.com", city: "Washington" },
    { displayName: "Sam Rivera", email: "sam.rivera@example.com", city: "Washington" },
    { displayName: "Morgan Chen", email: "morgan.chen@example.com", city: "Silver Spring" },
    { displayName: "Taylor Brooks", email: "taylor.brooks@example.com", city: "Washington" },
    { displayName: "Casey Nguyen", email: "casey.nguyen@example.com", city: "Silver Spring" },
    { displayName: "Jamie Ortiz", email: "jamie.ortiz@example.com", city: "Washington" },
  ];

  const users = [];
  for (const u of usersData) {
    const createdAt = daysAgo(120);
    const user = await prisma.user.create({
      data: {
        email: u.email,
        emailVerified: createdAt,
        emailDomain: u.email.split("@")[1],
        displayName: u.displayName,
        city: u.city,
        bio: `New-ish to ${u.city} and looking for people to grab a pint with.`,
        dateOfBirth: new Date("1994-03-15"),
        ageAttestedAt: createdAt,
        createdAt,
        isAdmin: "isAdmin" in u && u.isAdmin === true,
      },
    });
    users.push(user);
  }
  const [alex, priya, jordan, sam, morgan, taylor, casey, jamie] = users;

  const drinkPrefs: { user: (typeof users)[number]; kind: DrinkPreferenceKind; value: string }[] = [
    { user: alex, kind: DrinkPreferenceKind.BEER_STYLE, value: "ipa" },
    { user: alex, kind: DrinkPreferenceKind.BEER_STYLE, value: "sour" },
    { user: priya, kind: DrinkPreferenceKind.WINE_STYLE, value: "orange" },
    { user: priya, kind: DrinkPreferenceKind.WINE_STYLE, value: "sparkling" },
    { user: jordan, kind: DrinkPreferenceKind.BEER_STYLE, value: "stout" },
    { user: jordan, kind: DrinkPreferenceKind.NON_ALC, value: "na_beer" },
    { user: sam, kind: DrinkPreferenceKind.BEER_STYLE, value: "pilsner" },
    { user: sam, kind: DrinkPreferenceKind.WINE_STYLE, value: "red-blend" },
    { user: morgan, kind: DrinkPreferenceKind.BEER_STYLE, value: "ipa" },
    { user: morgan, kind: DrinkPreferenceKind.BEER_STYLE, value: "lager" },
    { user: taylor, kind: DrinkPreferenceKind.WINE_STYLE, value: "rose" },
    { user: taylor, kind: DrinkPreferenceKind.NON_ALC, value: "kombucha" },
    { user: casey, kind: DrinkPreferenceKind.BEER_STYLE, value: "sour" },
    { user: casey, kind: DrinkPreferenceKind.WINE_STYLE, value: "sparkling" },
    { user: jamie, kind: DrinkPreferenceKind.NON_ALC, value: "na_wine" },
    { user: jamie, kind: DrinkPreferenceKind.BEER_STYLE, value: "ipa" },
  ];
  for (const p of drinkPrefs) {
    await prisma.drinkPreference.create({
      data: { userId: p.user.id, kind: p.kind, value: p.value },
    });
  }

  // ---------- Tags ----------
  const tagDefs = [
    { slug: "after-work", label: "After Work" },
    { slug: "patio", label: "Patio" },
    { slug: "trivia-night", label: "Trivia Night" },
    { slug: "flight-tasting", label: "Flight Tasting" },
    { slug: "quiet-enough-to-talk", label: "Quiet Enough to Talk" },
    { slug: "dog-friendly", label: "Dog Friendly" },
    { slug: "food-truck", label: "Food Truck" },
    { slug: "new-release", label: "New Release" },
    { slug: "no-alcohol-friendly", label: "No-Alcohol Friendly" },
    { slug: "first-timers-welcome", label: "First-Timers Welcome" },
    { slug: "industry-night", label: "Industry Night" },
    { slug: "weekend-day-drinking", label: "Weekend Day Drinking" },
    { slug: "small-batch", label: "Small Batch" },
    { slug: "sour-focused", label: "Sour Focused" },
    { slug: "wine-down-wednesday", label: "Wine-Down Wednesday" },
    { slug: "birthday-round", label: "Birthday Round" },
  ];
  const tags: Record<string, Awaited<ReturnType<typeof prisma.tag.create>>> = {};
  for (const t of tagDefs) {
    tags[t.slug] = await prisma.tag.create({ data: t });
  }

  await prisma.tagFollow.createMany({
    data: [
      { userId: alex.id, tagId: tags["flight-tasting"].id },
      { userId: alex.id, tagId: tags["sour-focused"].id },
      { userId: priya.id, tagId: tags["wine-down-wednesday"].id },
      { userId: jordan.id, tagId: tags["trivia-night"].id },
      { userId: sam.id, tagId: tags["patio"].id },
      { userId: morgan.id, tagId: tags["after-work"].id },
      { userId: casey.id, tagId: tags["dog-friendly"].id },
    ],
  });

  // ---------- Venues ----------
  const denizens = await prisma.venue.create({
    data: {
      name: "Denizens Brewing Co.",
      slug: "denizens-brewing-co",
      address: "1115 East-West Hwy, Silver Spring, MD 20910",
      city: "Silver Spring",
      lat: 38.9958,
      lng: -77.0219,
      venueType: VenueType.BREWERY,
      noiseLevel: NoiseLevel.MODERATE,
      hasFlights: true,
      hasCommunalTables: true,
      hasOutdoorSeating: true,
      isDogFriendly: true,
      hasFood: true,
      acceptsLargeGroups: true,
      typicalPourPrice: 7.5,
      contactName: "Ops Team",
      contactEmail: "events@denizensbrewing.com",
      notes: "Reliable partner venue, roomy patio, food trucks most weekends.",
    },
  });

  const silverBranch = await prisma.venue.create({
    data: {
      name: "Silver Branch Brewing Company",
      slug: "silver-branch-brewing",
      address: "8401 Fenton St, Silver Spring, MD 20910",
      city: "Silver Spring",
      lat: 38.9963,
      lng: -77.0286,
      venueType: VenueType.BREWERY,
      noiseLevel: NoiseLevel.MODERATE,
      hasFlights: true,
      hasCommunalTables: true,
      hasOutdoorSeating: true,
      isDogFriendly: true,
      hasFood: true,
      acceptsLargeGroups: true,
      typicalPourPrice: 7,
      contactName: "Taproom Manager",
      contactEmail: "hello@silverbranchbrewing.com",
      notes: null,
    },
  });

  const astroLab = await prisma.venue.create({
    data: {
      name: "Astro Lab Brewing",
      slug: "astro-lab-brewing",
      address: "8216 Georgia Ave, Silver Spring, MD 20910",
      city: "Silver Spring",
      lat: 38.9974,
      lng: -77.0271,
      venueType: VenueType.TAPROOM,
      noiseLevel: NoiseLevel.LOUD,
      hasFlights: true,
      hasCommunalTables: true,
      hasOutdoorSeating: false,
      isDogFriendly: true,
      hasFood: false,
      acceptsLargeGroups: true,
      typicalPourPrice: 7,
      contactName: null,
      contactEmail: null,
      notes: "Trivia most Tuesdays, gets loud after 8pm.",
    },
  });

  const rightProper = await prisma.venue.create({
    data: {
      name: "Right Proper Brewing Company",
      slug: "right-proper-brewing",
      address: "624 T St NW, Washington, DC 20001",
      city: "Washington",
      lat: 38.9169,
      lng: -77.0219,
      venueType: VenueType.BREWPUB,
      noiseLevel: NoiseLevel.MODERATE,
      hasFlights: true,
      hasCommunalTables: true,
      hasOutdoorSeating: true,
      isDogFriendly: false,
      hasFood: true,
      acceptsLargeGroups: true,
      typicalPourPrice: 8,
      contactName: "Events Desk",
      contactEmail: "events@rightproperbrewing.com",
      notes: null,
    },
  });

  const corkWineBar = await prisma.venue.create({
    data: {
      name: "Cork Wine Bar",
      slug: "cork-wine-bar",
      address: "1720 14th St NW, Washington, DC 20009",
      city: "Washington",
      lat: 38.9139,
      lng: -77.0319,
      venueType: VenueType.WINE_BAR,
      noiseLevel: NoiseLevel.QUIET,
      hasFlights: true,
      hasCommunalTables: false,
      hasOutdoorSeating: false,
      isDogFriendly: false,
      hasFood: true,
      acceptsLargeGroups: false,
      typicalPourPrice: 14,
      contactName: "General Manager",
      contactEmail: "info@corkdc.com",
      notes: "Best for smaller, quieter rounds.",
    },
  });

  await prisma.venue.create({
    data: {
      name: "The Big Board",
      slug: "the-big-board",
      address: "1132 North Capitol St NW, Washington, DC 20002",
      city: "Washington",
      lat: 38.9058,
      lng: -77.0107,
      venueType: VenueType.BOTTLE_SHOP,
      noiseLevel: NoiseLevel.MODERATE,
      hasFlights: false,
      hasCommunalTables: true,
      hasOutdoorSeating: false,
      isDogFriendly: true,
      hasFood: true,
      acceptsLargeGroups: true,
      typicalPourPrice: 6.5,
      contactName: null,
      contactEmail: null,
      notes: "Rotating taps, big bottle selection, good for new-release nights.",
    },
  });

  // ---------- Groups ----------
  const techAfterHours = await prisma.group.create({
    data: {
      slug: "dmv-tech-after-hours",
      name: "DMV Tech After Hours",
      description: "For people who just moved to the area for a tech job and want low-key hangs after work.",
      city: "Silver Spring",
      kind: GroupKind.INDUSTRY,
      createdByUserId: null,
      status: GroupStatus.ACTIVE,
      lastRoundAt: daysAgo(3),
      createdAt: daysAgo(150),
    },
  });

  const newInSilverSpring = await prisma.group.create({
    data: {
      slug: "new-in-silver-spring",
      name: "New in Silver Spring",
      description: "General social group for anyone new to Silver Spring who wants to meet people over a pint.",
      city: "Silver Spring",
      kind: GroupKind.SOCIAL,
      createdByUserId: null,
      status: GroupStatus.ACTIVE,
      lastRoundAt: daysAgo(1),
      createdAt: daysAgo(200),
    },
  });

  const triviaAndTaprooms = await prisma.group.create({
    data: {
      slug: "trivia-and-taprooms",
      name: "Trivia & Taprooms",
      description: "We show up to trivia night at a different taproom every couple weeks.",
      city: "Silver Spring",
      kind: GroupKind.ACTIVITY,
      createdByUserId: alex.id,
      status: GroupStatus.ACTIVE,
      lastRoundAt: daysAgo(7),
      createdAt: daysAgo(90),
    },
  });

  const oldTakomaWineClub = await prisma.group.create({
    data: {
      slug: "old-takoma-wine-club",
      name: "Old Takoma Wine Club",
      description: "Quieter group centered on wine tastings around Takoma Park and DC.",
      city: "Washington",
      kind: GroupKind.SOCIAL,
      createdByUserId: null,
      status: GroupStatus.DORMANT,
      lastRoundAt: daysAgo(95),
      createdAt: daysAgo(300),
    },
  });

  await prisma.groupMembership.createMany({
    data: [
      { userId: alex.id, groupId: techAfterHours.id, role: MembershipRole.HOST, joinedAt: daysAgo(150) },
      { userId: priya.id, groupId: techAfterHours.id, role: MembershipRole.MEMBER, joinedAt: daysAgo(140) },
      { userId: jordan.id, groupId: techAfterHours.id, role: MembershipRole.MEMBER, joinedAt: daysAgo(100) },
      { userId: sam.id, groupId: techAfterHours.id, role: MembershipRole.MEMBER, joinedAt: daysAgo(80) },

      { userId: morgan.id, groupId: newInSilverSpring.id, role: MembershipRole.HOST, joinedAt: daysAgo(190) },
      { userId: taylor.id, groupId: newInSilverSpring.id, role: MembershipRole.MEMBER, joinedAt: daysAgo(150) },
      { userId: casey.id, groupId: newInSilverSpring.id, role: MembershipRole.MEMBER, joinedAt: daysAgo(60) },
      { userId: jamie.id, groupId: newInSilverSpring.id, role: MembershipRole.MEMBER, joinedAt: daysAgo(40) },
      { userId: alex.id, groupId: newInSilverSpring.id, role: MembershipRole.MEMBER, joinedAt: daysAgo(30) },

      { userId: alex.id, groupId: triviaAndTaprooms.id, role: MembershipRole.ADMIN, joinedAt: daysAgo(90) },
      { userId: sam.id, groupId: triviaAndTaprooms.id, role: MembershipRole.MEMBER, joinedAt: daysAgo(85) },
      { userId: casey.id, groupId: triviaAndTaprooms.id, role: MembershipRole.MEMBER, joinedAt: daysAgo(70) },

      { userId: priya.id, groupId: oldTakomaWineClub.id, role: MembershipRole.MEMBER, joinedAt: daysAgo(300) },
      { userId: jamie.id, groupId: oldTakomaWineClub.id, role: MembershipRole.MEMBER, joinedAt: daysAgo(280) },
    ],
  });

  // ---------- Venue offers ----------
  await prisma.venueOffer.create({
    data: {
      venueId: denizens.id,
      title: "First pour free for booked groups of 6+",
      terms: "Mention your Rounds group at the bar. First pour free for groups of 6 or more, Tue-Wed before 7pm.",
      minPartySize: 6,
      validDays: [2, 3],
      validFromHour: 16,
      validToHour: 19,
      startsOn: daysAgo(30),
      endsOn: null,
      isActive: true,
    },
  });

  await prisma.venueOffer.create({
    data: {
      venueId: rightProper.id,
      title: "Free flight upgrade for groups of 8+",
      terms: "Groups of 8 or more get a complimentary flight upgrade, weekdays before 6pm.",
      minPartySize: 8,
      validDays: [1, 2, 3, 4],
      validFromHour: 15,
      validToHour: 18,
      startsOn: daysAgo(10),
      endsOn: daysFromNow(60),
      isActive: true,
    },
  });

  // ---------- Rounds ----------
  const round1 = await prisma.round.create({
    data: {
      groupId: techAfterHours.id,
      hostId: alex.id,
      venueId: denizens.id,
      title: "After-work flights at Denizens",
      description: "Grabbing a flight after work, first-timers very welcome.",
      startsAt: daysFromNow(4),
      capacity: 6,
      isFlightFocused: true,
      status: RoundStatus.OPEN,
    },
  });
  await prisma.roundTag.createMany({
    data: [
      { roundId: round1.id, tagId: tags["after-work"].id },
      { roundId: round1.id, tagId: tags["flight-tasting"].id },
      { roundId: round1.id, tagId: tags["first-timers-welcome"].id },
    ],
  });
  await prisma.rsvp.createMany({
    data: [
      { roundId: round1.id, userId: alex.id, status: RsvpStatus.GOING, createdAt: daysAgo(2) },
      { roundId: round1.id, userId: priya.id, status: RsvpStatus.GOING, createdAt: daysAgo(2) },
      { roundId: round1.id, userId: jordan.id, status: RsvpStatus.GOING, createdAt: daysAgo(1) },
    ],
  });

  const round2 = await prisma.round.create({
    data: {
      groupId: newInSilverSpring.id,
      hostId: morgan.id,
      venueId: silverBranch.id,
      title: "Patio hang at Silver Branch",
      description: "Casual round on the patio, dogs welcome.",
      startsAt: daysFromNow(6),
      capacity: 8,
      isFlightFocused: false,
      status: RoundStatus.OPEN,
    },
  });
  await prisma.roundTag.createMany({
    data: [
      { roundId: round2.id, tagId: tags["patio"].id },
      { roundId: round2.id, tagId: tags["dog-friendly"].id },
    ],
  });
  await prisma.rsvp.createMany({
    data: [
      { roundId: round2.id, userId: morgan.id, status: RsvpStatus.GOING, createdAt: daysAgo(3) },
      { roundId: round2.id, userId: taylor.id, status: RsvpStatus.GOING, createdAt: daysAgo(2) },
    ],
  });

  const round3 = await prisma.round.create({
    data: {
      groupId: triviaAndTaprooms.id,
      hostId: alex.id,
      venueId: astroLab.id,
      title: "Trivia night at Astro Lab",
      description: "Weekly-ish trivia. We're usually mid-table, come save us.",
      startsAt: daysFromNow(2),
      capacity: 6,
      isFlightFocused: false,
      status: RoundStatus.OPEN,
    },
  });
  await prisma.roundTag.createMany({
    data: [
      { roundId: round3.id, tagId: tags["trivia-night"].id },
      { roundId: round3.id, tagId: tags["dog-friendly"].id },
    ],
  });
  await prisma.rsvp.createMany({
    data: [
      { roundId: round3.id, userId: alex.id, status: RsvpStatus.GOING, createdAt: daysAgo(4) },
      { roundId: round3.id, userId: sam.id, status: RsvpStatus.GOING, createdAt: daysAgo(3) },
      { roundId: round3.id, userId: casey.id, status: RsvpStatus.GOING, createdAt: daysAgo(3) },
    ],
  });

  // Small-capacity round that fills and produces a waitlist entry.
  const round4 = await prisma.round.create({
    data: {
      groupId: techAfterHours.id,
      hostId: jordan.id,
      venueId: rightProper.id,
      title: "New release tasting at Right Proper",
      description: "They just tapped a new saison, group of 4 to try it.",
      startsAt: daysFromNow(5),
      capacity: 4,
      isFlightFocused: true,
      status: RoundStatus.FULL,
    },
  });
  await prisma.roundTag.createMany({
    data: [
      { roundId: round4.id, tagId: tags["new-release"].id },
      { roundId: round4.id, tagId: tags["flight-tasting"].id },
    ],
  });
  await prisma.rsvp.createMany({
    data: [
      { roundId: round4.id, userId: jordan.id, status: RsvpStatus.GOING, createdAt: daysAgo(6) },
      { roundId: round4.id, userId: sam.id, status: RsvpStatus.GOING, createdAt: daysAgo(5) },
      { roundId: round4.id, userId: priya.id, status: RsvpStatus.GOING, createdAt: daysAgo(4) },
      { roundId: round4.id, userId: jamie.id, status: RsvpStatus.GOING, createdAt: daysAgo(3) },
      { roundId: round4.id, userId: casey.id, status: RsvpStatus.WAITLIST, createdAt: daysAgo(1) },
    ],
  });

  const round5 = await prisma.round.create({
    data: {
      groupId: newInSilverSpring.id,
      hostId: taylor.id,
      venueId: corkWineBar.id,
      title: "Quiet wine-down at Cork",
      description: "Small group, quiet corner, good for actually hearing each other talk.",
      startsAt: daysFromNow(8),
      capacity: 5,
      isFlightFocused: true,
      status: RoundStatus.OPEN,
    },
  });
  await prisma.roundTag.createMany({
    data: [
      { roundId: round5.id, tagId: tags["quiet-enough-to-talk"].id },
      { roundId: round5.id, tagId: tags["wine-down-wednesday"].id },
    ],
  });
  await prisma.rsvp.createMany({
    data: [
      { roundId: round5.id, userId: taylor.id, status: RsvpStatus.GOING, createdAt: daysAgo(2) },
      { roundId: round5.id, userId: jamie.id, status: RsvpStatus.GOING, createdAt: daysAgo(1) },
    ],
  });

  console.log("Seed complete:", {
    users: users.length,
    tags: Object.keys(tags).length,
    venues: 6,
    groups: 4,
    venueOffers: 2,
    rounds: 5,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
