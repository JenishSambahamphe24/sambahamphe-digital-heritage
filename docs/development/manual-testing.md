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
| D2 | Sign in as a **member without a role** (from section A) | A toast: "This account has no role in the admin site." The sign-in card keeps its size |
| D3 | Sign in as the super admin | Goes to **Users**: a table with your test accounts |
| D4 | Search for part of an email, press Enter | Table filters; the URL contains `?q=…` (refreshing keeps the search) |
| D5 | Click **Roles** on the member from section A | "Roles for <name>", "No roles yet." |
| D6 | Choose **Contributor** → **Give role** | Appears in the list as Active, Everywhere |
| D7 | Give the same role again | A toast: "They already have this role." The form doesn't move |
| D8 | In the incognito window, sign in to the admin as that member | Now allowed in (they have a role) |
| D9 | As super admin, click **Remove** on their Contributor role | Confirmation dialog first; confirm → status becomes "Revoked <date>" |
| D10 | In the incognito admin window, click any menu item | Signed out to the login page: losing the last role takes effect immediately |
| D11 | As super admin, open your **own** roles and try to remove **Super administrator** | A toast: "Appoint another super administrator before removing the last one." |
| D12 | **Audit log** | Newest first: role given / removed, sign-ins, failed sign-ins (no email addresses shown) |
| D13 | Switch the admin to **नेपाली**, refresh the page | Stays Nepali (remembered in this browser) |

## F. Admin — places and people (M2.1)

Sign in to the admin as the super admin (or anyone with the Genealogy editor role). Then `pnpm db:migrate` once if you haven't since pulling M2.1.

| # | Do | Expect |
|---|---|---|
| F1 | **Places** → **Add place**: "Nepal" (Country). Open it, add "Panchthar" (District) inside, then "Phidim" (Municipality) inside that with an other name "Phidim VDC", kind *Old name*, until 2017 | Each save shows a "Place saved." toast; the breadcrumb reads All places › Nepal › Panchthar |
| F2 | Search places for `Phidim VDC` | Phidim appears with "Also known as Phidim VDC" and its path |
| F3 | Edit Panchthar and pick Phidim as the place it is inside | Red toast: a place can't sit inside its own sub-place |
| F4 | Open Phidim in two tabs, change and save in tab 1, then save in tab 2 | Tab 2: toast "Someone else saved this first…", and the form reloads with tab 1's change |
| F5 | **People** → **Add person**: name "Sambahamphe Founder", add a second name in Devanagari (Also known as, Devanagari); Member of the line, Male, Deceased, Founding ancestor; Born: BS, About, 1900; place of birth Phidim | The date preview under Born reads in BS; after saving you land on the person's page, "Version 1" |
| F6 | Add a person marked **Living** with no birth year | Error under Born: give at least an approximate birth year. The form doesn't change size |
| F7 | Add a living adult (born AD 1985). Then under Privacy set Whole record and Names to *Everyone* and save | Errors under both: needs the person's recorded consent |
| F8 | On that person, **Record a new consent**: given by them, The person themself, Everyone, Names only. Save the privacy change again | Saves. In a private window, `http://localhost:3001/api/v1/persons/<their id>` shows the name but no birth date |
| F9 | Add a living person born AD 2015 without a reason | Error under Reason (who authorized adding the minor). With a reason it saves; setting Names to Everyone is refused |
| F10 | Search people for `sambahamphe`, then for `सम्बाहाङ्फे` | Both find the founder |
| F11 | On the founder, **Retract this record** with a reason | A confirmation dialog first; after confirming, the page says the record is retracted, and `…/api/v1/persons/<id>` answers 404 |
| F12 | **Audit log** | Entries "change_request.auto_approved" and "place.created" — no names or dates in them |
| F13 | Switch the admin to **नेपाली** and open a person | Labels, dates and choices are in Nepali |

## G. Admin — organization (M2.2)

Run `pnpm db:migrate` once after pulling M2.2. Sign in as the super admin (or anyone with the Organization manager role).

| # | Do | Expect |
|---|---|---|
| G1 | **Organization** in the sidebar | One board: Central Board |
| G2 | **Positions** → add Chairperson (order 1, 1 holder at a time, office-bearer), Secretary (2, 1 holder), Member (9, up to 3) | Each appears in order with "One holder at a time" / "Up to 3 holders" |
| G3 | Back on Organization: **Add a board under** Central Board → only *Regional Board* is offered; name it, web address `koshi-regional`, area Panchthar | Saved; you land on its page, path shows "Central Board" |
| G4 | Add another board with the same web address | Toast: another board already uses this web address |
| G5 | On Central Board → **Terms** → **Add a term**: number 5, starts BS 2079 (year only), no end | Listed as "Term 5 · Current", start shown in BS |
| G6 | Add a second term starting BS 2080 | Toast: this board already has a term in those dates |
| G7 | **Members** → add a Chairperson: type 2 letters of a person from section F, pick them, start = the term start | Listed under Members with "Elected" and the BS date |
| G8 | Add a second Chairperson in the same term | Toast: someone else holds this position in those dates |
| G9 | Add 3 Members, then a 4th | The 4th: every seat in this position is taken |
| G10 | Add the minor from F9 as a Member, then open `http://localhost:3001/api/v1/org/units/<central id>/board` in a private window | The minor is **not** in the public board; the adults show name and position only |
| G11 | **End** the Chairperson (BS 2081, Resigned), then add a new Chairperson from BS 2081 | Both saved: the first shows "– … (resigned)" |
| G12 | **Retract** a member: confirmation dialog with a reason first | The entry leaves the list |
| G13 | Switch the admin to **नेपाली** | Organization pages, dates and choices are in Nepali |

## E. Look and feel (any page)

| # | Check |
|---|---|
| E1 | Narrow the window to phone width: nothing overflows sideways; forms stay usable |
| E2 | Press **Tab** through a form: every field and button gets a visible focus ring, in order |
| E3 | Nepali text renders in a proper Devanagari font (no boxes or mixed fonts) |
| E4 | Open the browser console (F12): no red errors while using the pages |
| E5 | Sign in / Create account / forgot / reset / confirm email pages: the painting is on the right on desktop and a banner on top on a phone, as on the design canvas (`docs/design/canvas/Main.dc.html`, `Mobile.dc.html`). The **Sign in** / **Create account** tabs switch pages and keep the language |
| E6 | Leave a field with a wrong value so its error appears: the fields below stay where they were |
