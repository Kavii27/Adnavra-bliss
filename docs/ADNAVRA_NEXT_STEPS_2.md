# ADNAVRA, Round 2, Fix the Onboarding Gap and Clean Up the Copy

I checked the project you uploaded against the last set of tasks. None of the five
fixes from ADNAVRA_NEXT_STEPS.md have been applied yet. The font is still fetched live
from Google in layout.tsx, there is still no test runner installed, the database still
only protects staff assigned bookings from double booking, npm audit has not been run,
and the color palette is still the original warm terracotta rather than the clean,
minimal direction you picked earlier. None of that is urgent to redo right now, but it
is still on the list.

What I found this time, by reading your actual screenshots and the actual code, is a
different and more important problem: the dashboard does not know what to do with a
brand new owner who has not created a business yet. It just loads the dashboard shell
anyway and shows a red error banner on every tab. That is why it feels broken and thin.
It is not actually broken, it is just missing a guardrail.

## Root cause: the dashboard never redirects new owners to onboarding

Look at `src/app/dashboard/layout.tsx`. It checks whether the user is logged in and
whether their role is allowed, but it never checks whether `businessId` is null. So a
new owner who signed up without filling in the business name lands straight on
Bookings, Calendar, Staff, and Customers, and every single one of those pages
independently discovers there is no business and shows its own "No business linked"
error. That is not a design problem, it is a missing redirect.

### Task 1: Redirect owners with no business straight to setup

Prompt for your agent:
```
In src/app/dashboard/layout.tsx, after confirming the user is logged in and has an
allowed role, check if businessId is null for OWNER or STAFF roles. If it is null and
the current path is not already /dashboard/settings, redirect to /dashboard/settings.
Do this with the redirect function from next/navigation, the same way the existing
auth check does it. Do not change the ADMIN path, admins can view the dashboard without
a business.
```

Expected shape of the change:
```tsx
import { redirect } from "next/navigation";

// after the existing role check, before rendering the shell
const businessId = (session.user as unknown as { businessId: string | null }).businessId;
if ((role === "OWNER" || role === "STAFF") && !businessId) {
  redirect("/dashboard/settings");
}
```

**Definition of done:**
- [ ] Sign up a fresh account without filling in the business name
- [ ] Land directly on Settings with the "Create your salon profile" form, not on Bookings with a red error
- [ ] Filling in the form and saving takes you to a working dashboard with no more red banners

### Task 2: Make the empty state on Settings friendlier, not scarier

Right now every tab shows the same alarming red "No business linked to account" text
even though this is completely normal for a brand new account. Once Task 1 is done,
most people will never see this message, but it is still worth softening for the edge
case (for example, a staff member invited before an owner finishes setup).

Prompt for your agent:
```
Find every place in the dashboard pages that renders "No business linked to account" or
similar text in a red/error style. Change the styling from an error/warning tone to a
neutral, calm tone, since this is an expected state for new accounts, not a system
failure. Keep the message but move it into the same empty state box that already exists
below it, rather than as a separate red line above it.
```

**Definition of done:**
- [ ] No red warning icon or red text for this specific case
- [ ] The message and the empty state box read as one calm unit, not two competing UI elements

## The em dash problem

I counted 78 separate lines in your source code that use an em dash character. That
includes the dashboard header ("ADNAVRA, Dashboard"), page subtitles, button labels, and
even the page metadata description. This is one of the most recognizable tells of
AI generated writing, so it is worth a dedicated sweep rather than fixing it page by
page as you notice it.

### Task 3: Sweep every em dash out of the codebase

Prompt for your agent:
```
Search the entire src directory for the em dash character (—) in string literals, JSX
text, and metadata. For each one, rewrite the sentence without it, using a period, a
comma, "and", parentheses, or simply splitting into two shorter sentences, whichever
reads most naturally. Do not use a regular hyphen (-) as a direct substitute, actually
rewrite the phrasing. Show me a list of every file you changed and the before and after
text for each change so I can review it.
```

This matters enough that you should actually read the list your agent gives you back.
An agent doing a mechanical find and replace of em dash to comma often produces
sentences that read worse than the original. Spot check a handful before accepting.

**Definition of done:**
- [ ] `grep -rn "—" src` returns zero results
- [ ] The rewritten sentences still sound natural when you read them out loud, not choppy or robotic

## Addressing "too simple"

Some of this is genuinely just missing content rather than a design flaw, since an
empty database with no bookings, no customers, and one flat color palette will always
look thin no matter how good the underlying code is. A few concrete, non-subjective
things to fix regardless of your color decision:

### Task 4: Give empty states an actual next step, not just a description

Right now, empty states across dashboard pages (Customers, Calendar, Bookings) are a
plain box with a sentence in it. None of them have a button. A person landing there has
to already know to click "Services" or "Settings" in the nav bar.

Prompt for your agent:
```
For every empty state box in the dashboard (Bookings, Calendar, Customers, Staff), add
a relevant call to action button underneath the existing text. For Bookings and
Calendar, link to the business's public booking page (copy the URL, or open it in a new
tab). For Customers, explain that customers appear after a booking and link to the
booking page too. For Staff, add a real "Add staff member" button, since that page
currently has no visible action at all.
```

**Definition of done:**
- [ ] Every empty state has at least one button, not just text
- [ ] The Staff page specifically has a working "Add staff member" action, since it currently appears to have none

### Task 5: Finish the pending design decision

This is still an open item from before. The color palette you are shipping right now
(warm terracotta) does not match the clean, minimal, professional direction you chose
earlier when we picked Cal.com's design-md as the reference. Pick one of the two options
below and tell your agent explicitly, do not leave it ambiguous:

**Keep terracotta:** no action needed, just confirm this was a deliberate choice.

**Switch to clean and minimal:** use the same prompt from the previous next-steps file,
reproduced here for convenience:
```
Re-read DESIGN.md's structural rules but replace the current warm terracotta palette in
globals.css with a clean, minimal, professional palette in the spirit of Cal.com's
design-md reference, restrained neutrals with a single muted accent color such as a deep
teal or slate blue, not warm or orange tones. Update globals.css, DESIGN.md, and any
hardcoded hex colors currently in components (for example the marketing page) to use the
new tokens instead of inline hex values.
```

## What is still outstanding from the first round

These have not been touched yet. They do not block you from testing the app today, but
do not consider the project production ready until they are done:

- Task 1 from the previous file: stop fetching Inter from Google at build time
- Task 2 from the previous file: install a test runner and actually run the existing tests
- Task 3 from the previous file: close the unassigned booking race condition with a
  second database constraint
- Task 4 from the previous file: run npm audit and fix high or critical issues

## Suggested order

1. Task 1 here (onboarding redirect), since it fixes the actual bug you are hitting right now
2. Sign up fresh and walk through the full flow yourself: signup without a business,
   land on Settings, create the business, confirm the dashboard now works with no red
   banners anywhere
3. Task 3 here (em dash sweep), since it is mechanical and low risk
4. Task 5 here (finish the color decision), since everything after this depends on it
5. Task 4 here (empty state buttons), now that the palette is settled
6. Go back and finish the four outstanding tasks from the first round before you
   consider this ready to show anyone outside your own testing
