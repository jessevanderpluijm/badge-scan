# Badge Scan

Self-serve check-in and badge printing for networking events: conferences, trade shows,
and networking drinks. Organizers create an event, import attendees via CSV, and validate
tickets at the door with an external scanner — without custom onboarding or on-site staff.

## Product vision

> In the future, every attendee of a networking event walks in without waiting, wearing a
> badge with their name on it that opens the conversation — and any organizer can set this
> up themselves in minutes, not through an expensive project quote.

The 5-10 year goal: **become the standard for event check-in in NL/EU**. Not because we
are the biggest platform, but because an organizer reaches for this tool by default, the
way you reach for a spreadsheet — obvious, reliable, and hassle-free.

## The problem that drives us

Today, check-in and badges at networking events are delivered as expensive custom work:
custom onboarding, on-site staff, cumbersome workflows. There is **no good self-serve
solution**, and existing systems don't integrate smoothly with the various ticketing
systems. As a result, something that should be simple — letting someone in with their name
— stays needlessly expensive and complex.

Our lever is **ease**: we make scanning badges as simple as possible and integrate
effortlessly with any ticketing system, so an organizer never has to think about
technology or integrations. That ease isn't a luxury — it is the cost model: because the
organizer sets it up themselves and the scan flow just works, the need for custom
onboarding and on-site staff disappears, and with it the high costs.

Every product decision should shrink that pain: **make it self-serve, cheap, and smoothly
integratable.** When we must choose between "more powerful but requires hand-holding" and
"simpler and self-serve", we choose the latter — because every step we remove for the user
directly lowers the cost.

## Why badges are central

These are events where people network. A badge with your name on it isn't an
administrative byproduct but the core of the experience: it makes conversation between
strangers easy. That's why check-in and badge printing belong together.

## How it works

See [`README.md`](README.md) for setup, tech stack, and the full user flow. In short:
Next.js 16 (App Router) + Supabase (auth, Postgres, Row-Level Security). CSV upload with a
column-mapping step, and a full-screen scanner that works with a USB scanner emitting
`<barcode>\n`.

## Out of scope (for now)

- Custom integrations that only work with hand-holding — that's exactly the model we want
  to replace.
- Features that make self-serve unusable (mandatory onboarding, complex configuration).
