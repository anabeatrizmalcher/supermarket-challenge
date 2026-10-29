# Supermarket Challenge

Web game (mobile first) to practice countable/uncountable nouns in English.
Vite + React + TypeScript + Tailwind + Zustand + three.js (first-person street) + Supabase.

## Run it

```bash
npm install
npm run dev      # opens on your network too (--host), so phones on the same Wi-Fi can join
npm test         # pure logic + reducer tests (includes the 10k-seed plan generator)
npm run build
```

Without Supabase configured the app runs in **local test mode** (state kept in the browser's
localStorage, so only tabs of the same browser play together). Good for trying the whole flow:
open `/?host` in one tab, and `/` in other tabs.

## Real multiplayer (Supabase)

1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
2. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Deploy on Vercel with the same two variables. Share the link/QR code; keep the `?host` link for yourself.

## How to play (controls)

- Street: touch the left half of the screen to walk (virtual joystick), drag the right half to look.
  On PC: WASD / arrows to walk, drag the mouse to look.
- Get close to a door and tap "Enter". Checkout unlocks when everything on the list is in the cart.
- Inside a shop you walk the same way. Tables hold the items on sale (with price tags): tap an item to pick it up, then the seller asks how many/much. "Ask the seller" lets you request an item from your list by name (that is how the wrong-shop case happens). Tap the EXIT door behind you, or the button, to go back to the street.
- At the checkout the items you bought are laid out on the counter.

## Is real-time working?

The badge on the first screens tells you: 🟢 Live (Supabase realtime connected), 🟠 connected but realtime
not subscribed (the app still refreshes every 2 s), 🔴 cannot reach Supabase, 🟡 local test mode.
If it stays orange, check that the `alter publication supabase_realtime ...` line of `schema.sql` ran.

## Where things live

- `src/features/game/content/` items.json, dialogs.json (all English text and Portuguese hints), config.ts (points, wallet slack, multipliers, time), places.ts (where each shop is on the street).
- `src/features/game/logic/` pure rules: pricing, scoring, plans, ranking.
- `src/features/game/state/` types, reducer, store (with localStorage persistence).
- `src/features/game/components/` Street3D (the first-person street), ShopInterior3D (shop rooms with pickable items), itemModels (3D models), ShopScene, BlankChoices, QuantityFocus, Cart, Hud, Checkout.
- `src/features/match/` Supabase API (+ local fallback) and hooks.

## Decisions I made (the doc left them open)

- O1: a player who can't pay loses (0 points). O2: total and wallet always visible. O3: no returns. O4: leftover money gives no points.
- The "4 places" on the street are Bakery, Market, Supermarket and Checkout.
- The street is a 3D first-person scene instead of the side-scrolling street of the doc.
- On timeout each client submits its current points with the max time. A player who disappears counts as 0 points and max time.
- Added `finish_match` (host "Close match now") and `server_time` (clock sync) RPCs to the schema.

## Not done yet

- Playwright end-to-end test, component tests (Testing Library) and ESLint config.
- Art is simple SVG/emoji/3D boxes; no sound; no real-device performance pass.
- Not tested against a real Supabase project.
