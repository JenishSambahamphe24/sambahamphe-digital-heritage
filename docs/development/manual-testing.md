# Manual testing checklist — web and admin

We check the browser journeys by hand (ADR-018 update). Run through this list after any change to `apps/web`, `apps/admin`, `packages/ui`, or the auth API. When something fails, note the **row number**, what you did and what you saw (a screenshot helps).

## Setup

```bash
pnpm infra:up && pnpm db:migrate && pnpm dev
```

- Public site: http://localhost:3000 · Admin: http://localhost:3002 · Emails: http://localhost:8025
- Use a **private/incognito window** for the "member" steps and a normal window for the admin, so the two logins don't mix.
- Use new email addresses each run (e.g. `test1@example.com`, `test2@example.com`); all mail lands in Mailpit, never a real inbox.

## A. Public site — new member

| # | Do | Expect |
|---|---|---|
| A1 | Open http://localhost:3000 | Redirects to `/en` (or `/ne` if your browser prefers Nepali). Home page shows the title and two buttons |
| A2 | Click **नेपाली** in the header | Same page in Nepali, URL `/ne`. Click **English** to go back |
| A3 | **Create an account** → click the button with every field empty | Nothing is sent; errors appear under the fields after you leave them |
| A4 | Type an invalid email (`abc`) and leave the field | "Enter a valid email address." under Email |
| A5 | Type a 5-character password and leave the field | "Use at least 10 characters." |
| A6 | Fill name, a new email, a 10+ character password → **Create account** | Button shows a spinner, then the "Check your email" card with the drummer-and-dancer illustration |
| A7 | Open Mailpit → the "Confirm your email address" message | Greeting uses your name; link looks like `http://localhost:3000/en/verify-email#token=…` |
| A8 | Click the link in the email | "Your email is confirmed. You can now sign in." |
| A9 | Click the same link again | "This link is invalid, already used or expired." |
| A10 | Register again with the **same** email | Same "Check your email" answer (no "already taken" message); Mailpit gets a "Someone tried to sign up…" email instead |

## B. Public site — sign in, devices, sign out

| # | Do | Expect |
|---|---|---|
| B1 | **Sign in** with a wrong password | A red toast bottom-right: "The email or password is incorrect." It leaves after 5 seconds or on ×; the typed email stays |
| B2 | Sign in with an email that doesn't exist | The exact same message as B1 |
| B3 | Sign in correctly | Goes to **My account**: your name, email, "Email confirmed". Header now shows **My account** instead of Sign in |
| B4 | In a second browser (or incognito), sign in as the same member | Back in the first browser, refresh **My account**: two devices listed, one marked **This device** |
| B5 | Click **Sign out** on the *other* device | A confirmation dialog appears first. Cancel closes it; nothing changes |
| B6 | Repeat B5 and confirm | The device disappears from the list. In the second browser, refresh: it's signed out |
| B7 | Click **Sign out** (top right) | Back to the sign-in page; visiting `/en/account` sends you to sign in |
| B8 | Try signing in with a wrong password 11 times quickly | From the 11th attempt: "Too many attempts. Wait a minute and try again." |

## C. Public site — forgot password

| # | Do | Expect |
|---|---|---|
| C1 | **Forgot your password?** → enter your email → send | "Check your email" |
| C2 | Do C1 with an email that doesn't exist | Same message; **no** email in Mailpit |
| C3 | Open the reset email's link → enter a new 10+ character password | "Your password is changed and you are signed out everywhere" |
| C4 | Sign in with the old password, then the new one | Old fails, new works |
| C5 | Open http://localhost:3000/en/reset-password directly (no link) | "This page needs the link from your email…" |

## D. Admin

You need a super admin first (once per database): register and confirm an account on the public site, then
`pnpm --filter api build && pnpm --filter api admin:bootstrap --email <that email>`.

| # | Do | Expect |
|---|---|---|
| D1 | Open http://localhost:3002 | Redirects to the admin sign-in page |
| D2 | Sign in as a **member without a role** (from section A) | "This account has no role in the admin site." |
| D3 | Sign in as the super admin | Goes to **Users**: a table with your test accounts |
| D4 | Search for part of an email, press Enter | Table filters; the URL contains `?q=…` (refreshing keeps the search) |
| D5 | Click **Roles** on the member from section A | "Roles for <name>", "No roles yet." |
| D6 | Choose **Contributor** → **Give role** | Appears in the list as Active, Everywhere |
| D7 | Give the same role again | "They already have this role." |
| D8 | In the incognito window, sign in to the admin as that member | Now allowed in (they have a role) |
| D9 | As super admin, click **Remove** on their Contributor role | Confirmation dialog first; confirm → status becomes "Revoked <date>" |
| D10 | In the incognito admin window, click any menu item | Signed out to the login page: losing the last role takes effect immediately |
| D11 | As super admin, open your **own** roles and try to remove **Super administrator** | "Appoint another super administrator before removing the last one." |
| D12 | **Audit log** | Newest first: role given / removed, sign-ins, failed sign-ins (no email addresses shown) |
| D13 | Switch the admin to **नेपाली**, refresh the page | Stays Nepali (remembered in this browser) |

## E. Look and feel (any page)

| # | Check |
|---|---|
| E1 | Narrow the window to phone width: nothing overflows sideways; forms stay usable |
| E2 | Press **Tab** through a form: every field and button gets a visible focus ring, in order |
| E3 | Nepali text renders in a proper Devanagari font (no boxes or mixed fonts) |
| E4 | Open the browser console (F12): no red errors while using the pages |
| E5 | Sign in / Create account / forgot / reset / confirm email pages: the painting is on the right on desktop and a banner on top on a phone, as on the design canvas (`docs/design/canvas/Main.dc.html`, `Mobile.dc.html`). The **Sign in** / **Create account** tabs switch pages and keep the language |
