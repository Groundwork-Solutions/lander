# Groundwork Solutions — landing page

Static landing page for Groundwork Solutions. No framework, no build dependencies —
three source files and one optional Node script that inlines them.

    index.html     markup and copy
    styles.css     design tokens + all styling
    script.js      theme toggle, scroll reveal, marquee sizing
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

Blueprint cyanotype, adapted from the structural language of ribbitcap.com — Space Mono
throughout, hard 1px rules, zero border-radius, counter-scrolling marquee bands.

| token          | light     | dark      |
| -------------- | --------- | --------- |
| `--paper`      | `#e8e9e4` | `#0a1633` |
| `--tint`       | `#dee2e8` | `#0e1d40` |
| `--ink`        | `#10131c` | `#eef3fb` |
| `--ink-soft`   | `#4e5666` | `#93a8d0` |
| `--rule`       | `#b9c0ce` | `#26386e` |
| `--signal`     | `#1b44e0` | `#3e6bff` |
| `--signal-ink` | `#ffffff` | `#04091c` |
| `--void`       | `#0a1633` | `#04091c` |

Light is the base. Dark is redefined twice — once under `prefers-color-scheme` (guarded
with `:not([data-theme="light"])`) and once under `[data-theme="dark"]` — so the OS
setting and the in-page toggle each win in the right direction. Every color comes from a
token; nothing is declared only inside a media or `[data-theme]` block.

The toggle persists to `localStorage` under `gw-theme`.

## Before launch — placeholders to replace

Search the source for these; each is marked with an HTML comment.

1. **Stats** (`#proof`) — `71%`, `<1s`, `22h`, `6wk` are illustrative, not measured.
   Replace with your own figures or delete the band.
2. **Testimonials** — all three quotes and the people and companies attributed to them
   are invented. Swap in real, permissioned quotes before this page is public.
3. ~~**Contact**~~ — done. "book a call" (nav) and "book a fit call" (CTA) open the
   Google Calendar booking page; the ghost button and the footer link mail
   `dothan@trygroundworksolutions.com`.
4. **Pricing and process claims** — the six-week timeline, the fixed-fee structure, and
   the data-handling commitments in the FAQ are written as reasonable defaults. Confirm
   each one matches what you actually offer.

## Accessibility notes

Skip link, visible focus rings, `prefers-reduced-motion` disables the marquee and the
scroll reveal, and the marquee bands are `aria-hidden` since they are decorative.

The nav links collapse below 900px; the "book a call" action stays visible at every
width. There is no mobile drawer — if the nav grows past four items, add one.
