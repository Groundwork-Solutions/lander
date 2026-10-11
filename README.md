# Groundwork Solutions — landing page

Static landing page for Groundwork Solutions, positioned as an outsourced AI
engineering team. The copy follows `material/company/groundwork-company-overview.pdf`
for who we are, what we offer, plans and working together, with extra sections for the
idea-to-running flow, what we can build and 24/7 support. The offer is **the first
workflow free for 14 days from the day it goes live** (the PDF still says 30 days). No framework, no build dependencies — three source
files, the team photos in `team/`, and one optional Node script that inlines them.

    index.html     markup and copy
    styles.css     design tokens + all styling
    script.js      workflow conversations and the hero activity feed
    team/          management photos (360px, from material/company/team/)
    build.js       inlines the above into dist/
    dist/          generated — do not edit by hand

## Running it

Open `index.html`, or serve the folder:

    python3 -m http.server 8899

To regenerate the self-contained builds:

    node build.js

`dist/index.html` is a single portable file, except for the team photos, which it
still loads from `team/`. `dist/artifact.html` is the same page as a
body-only fragment, for hosts that supply their own document shell.

## Contact form

The form in the closing section posts JSON to `api/contact.js`, a Vercel function that
emails each enquiry through Resend (Vercel Marketplace integration on the
groundwork-solutions team). It needs `RESEND_API_KEY` on the project; `CONTACT_TO`
(default dothan@) and `CONTACT_FROM` (default website@trygroundworksolutions.com, which
must be on a domain verified in Resend) are optional. A hidden `website` field catches
bots. `python3 -m http.server` can't run the function; use `vercel dev` to test it.

## Design system

Light-only, white page with a cool grey canvas band. Loosely inspired by crewplatforms.com,
but with Groundwork's own brand blue, type and layout.

| role            | value                                   |
| --------------- | --------------------------------------- |
| brand           | `#1b44e0` (buttons, links, closing CTA) |
| ink / muted     | `#0f1012` / `#6c6c71`                    |
| canvas          | `#f4f5f8`                                |
| display type    | Bricolage Grotesque                      |
| body type       | Hanken Grotesk                           |
| mono labels     | IBM Plex Mono                            |

Each agent has an accent colour (receptionist clay, booking blue, ticket support moss,
lead finder plum, invoices ochre, knowledge teal), set inline on its card as `--acc`,
`--acc-soft` and `--acc-glow`. There is deliberately no `color-mix()` anywhere, so older
iOS Safari renders the same colours.

## Animations

Everything animated lives in `script.js`:

- **Agent cards**: each plays a looping conversation from `SCRIPTS`. Steps are
  `[speaker, text]` where speaker is `them`, `ai`, `sys`, `ok`, `warn`, `photo`, or a
  visual card: `cal` (calendar slot), `leads` (verified company list), `mail` (drafted
  email), `doc` (invoice checked against a PO).
- **Agent ring**: the six agent cards sit on a 3D ring that holds each card at the
  front for about 5 seconds, then turns. Drag, arrows, tabs or clicking a side card
  also turn it; hovering holds it. On wide screens (≥ ~1300px) the side notes show
  what the front agent handles and when it hands back — edit them in `NOTES`. With
  reduced motion the original grid shows instead.
- **Hero feed**: an example client's week from their Groundwork team — workflows going
  live, fixes, weekly calls, reports. New rows arrive every few seconds (`POOL`).
- **Weekly-call card**: the client's request types itself, then the spec fills in.

Every loop pauses when it's off screen or the tab is hidden, and each runs inside its own
guard so one failure can't stop the others. With reduced motion switched on, the
conversations still play, but items fade in place instead of sliding, and the purely
decorative loops (pulsing dots, shimmer, scanner sweep) are off.

## Before each publish — claims to keep true

1. **The four numbers** under "Who we are" (businesses, workflows, uptime, staff hours)
   are marked with an HTML comment. Keep them in step with the company overview.
2. **Plans** mirror the overview's plan table. Pricing is quoted separately, not shown.
3. **Example content**: the hero feed and every workflow conversation are illustrative
   and labelled as examples.

## Accessibility notes

Skip link, visible focus rings, and the reduced-motion behaviour described under
Animations. The hero dashboard is a single `role="img"` with a text label, so screen
readers aren't read a stream of changing rows.

The nav links (four) collapse below 900px; "Book a call" stays visible at every
width. There is no mobile drawer — if the nav grows past four items, add one.
