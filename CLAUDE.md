# Rounds

## PRODUCT
Rounds helps people who are new to a city or a job find people to drink and
hang out with. The core mechanic is that users RSVP to a *round* — a specific
group, at a specific brewery or wine bar, at a specific time, with a capacity
cap. There is no swiping and no one-to-one matching.

## VENUES
The venue set is deliberately narrow: breweries, taprooms, beer gardens,
brewpubs, wine bars, tasting rooms, and bottle shops with taps. Not cocktail
bars, not clubs, not restaurants. These venues are quieter, cheaper,
daytime-viable, and built for lingering conversation, which is the entire
point. Venue records carry attributes that matter for a group of strangers:
noise level, communal tables, whether they pour flights, outdoor seating, dog
friendly, food on site.

## FLIGHTS
A tasting flight is the product's best conversational prop — it gives
strangers a shared task. Surface flight availability prominently and let
hosts mark a round as flight-focused.

## STRUCTURE
Users belong to groups. Groups are open — any signed-in user can browse and
join any active group. Some are admin-seeded; others are created by users who
earn the ability. Rounds are posted inside a group. Any member can host.

## TAGS
Rounds carry tags from a curated, admin-managed vocabulary (after work,
patio, trivia night, flight tasting, quiet enough to talk, dog friendly, food
truck, new release, no-alcohol friendly). Users follow tags; followed tags
boost and filter their feed. Tags substitute for subdividing groups, and tag
demand tells us empirically which groups to create.

## THE LOOP
Planned rounds are the discovery mechanism. Confirmed co-attendance creates a
"warm graph" edge between two users. A separate spontaneous mode called LAST
CALL ("I'm at Denizens, two seats at the bar") is visible ONLY to a user's
warm graph. Planned = acquisition, last call = retention.

## XP
Points come from HOSTING rounds that fill and from bringing repeat attendees.
Never from attending alone, and never from drinks consumed — there is no
consumption tracking anywhere in this product. Scores are private; no public
leaderboard.

## VENUE OFFERS
A venue may author an offer (e.g. "first pour free for booked groups of 6+,
Tue-Wed before 7"). The app surfaces the offer; the venue fulfills it. The
app never issues, holds, or redeems alcohol itself.

## UNLOCKS
Creating a group is earned. A user may create one after hosting 3 rounds that
each reached 4+ confirmed attendees. Cap 2 groups per person. Creator becomes
group ADMIN and is accountable for it.

## DORMANCY
A group with no rounds in 60 days goes DORMANT — hidden from browse, not
deleted. Posting a round revives it. The graveyard is invisible.

## AGE
21+ only. Date of birth collected and attested at signup, enforced
server-side on every session.

## STACK
Next.js App Router, TypeScript, Tailwind, shadcn/ui, Prisma, Postgres,
Auth.js. Vercel.

## CONVENTIONS
Server components by default; server actions for mutations. Zod on all
input. Timestamps UTC. No secrets in the repo.

## NON-GOALS FOR V1
Payments, app-issued drink currency, consumption tracking, push
notifications, DMs, native apps, identity verification, ratings.
