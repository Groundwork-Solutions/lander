# Groundwork Solutions — landing page

Static landing page for Groundwork Solutions. No framework, no build dependencies —
three source files and one optional Node script that inlines them.

    index.html     markup and copy
    styles.css     design tokens + all styling
    script.js      agent conversations and dashboard animations
    build.js       inlines the above into dist/
    dist/          generated — do not edit by hand

## Running it

Open `index.html`, or serve the folder:

    python3 -m http.server 8899

To regenerate the self-contained builds:

    node build.js

`dist/index.html` is a single portable file. `dist/artifact.html` is the same page as a
body-only fragment, for hosts that supply their own document shell.

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
- **Approval card**: plays Karen's refund thread, then waits for the visitor to click.
- **Hero dashboard**: new rows arrive every few seconds and the counters tick up.
- **Brief card**: the owner's brief types itself, then the plan fills in.

Every loop pauses when it's off screen or the tab is hidden, and each runs inside its own
guard so one failure can't stop the others. With reduced motion switched on, the
conversations still play, but items fade in place instead of sliding, and the purely
decorative loops (pulsing dots, shimmer, scanner sweep) are off.

## Before launch — placeholders to replace

Search the source for these; each is marked with an HTML comment.

1. **Example content**: the dashboard numbers, the "Groundwork Solutions" dashboard, and
   every conversation are illustrative, and the page labels them as examples. Tool names
   (Jobber, HubSpot, QuickBooks, Calendly) should list only what you can actually connect.
2. ~~**Contact**~~ — done. "book a call" (nav) and "book a fit call" (CTA) open the
   Google Calendar booking page; the ghost button and the footer link mail
   `dothan@trygroundworksolutions.com`.
3. **Pricing and process claims** — the six-week timeline, the fixed-fee structure, and
   the data-handling commitments in the FAQ are written as reasonable defaults. Confirm
   each one matches what you actually offer.

## Accessibility notes

Skip link, visible focus rings, and the reduced-motion behaviour described under
Animations. The hero dashboard is a single `role="img"` with a text label, so screen
readers aren't read a stream of changing rows.

The nav links collapse below 900px; "Book a call" stays visible at every
width. There is no mobile drawer — if the nav grows past four items, add one.
