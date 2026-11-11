# Design

Two artifacts in Claude hold the design. This folder mirrors the canvas so code can be built from it.

| Artifact | What it holds | How it changes |
|---|---|---|
| [Sambahamphe Utthan Sangh — Website](https://claude.ai/artifact/QSrUga2EwkNi7L9ekh21bw) (Design canvas) | Every screen, plus the Colours and Components boards. Pages: Foundations, Auth, Home, Family tree, About & boards, News, events & gallery, Account & system. | Design on the canvas, then run `/sync-design` to pull it into `canvas/`. |
| [Sambahamphe Utthan Sangh](https://claude.ai/artifact/M6XNXUjVwWnxJXygH6zTak) (Design System) | Tokens, the `@repo/ui` components with live previews, the brand guide and approved images. The canvas installs a copy of it. | Generated from `packages/ui`. Change the code, then ask Claude to re-sync the design system and refresh the canvas copy. |

The canvas is the source of truth for screens. Don't edit `canvas/` by hand; change the canvas and sync.

## Design rules

These apply to every board and to the code built from it.

- **Messages never resize their container.** A form, card or modal that can show a success or error message has that space from the start: every field keeps one line under it for its hint or error, and a failed action shows a toast (bottom-right; full width on phones), which floats over the page. A state that replaces the content (a missing link, "email confirmed") may use an Alert.

## Approved changes not yet on the canvas

None. The auth changes approved in code review (no Silam Sakma above the tabs, centred tabs and footer line, tighter fields that keep their message line) are on the canvas as of 11 Nov 2026.

## Canvas boards

| File | Page | What it shows |
|---|---|---|
| Colours.dc.html | Foundations | Brand, neutral and status colours with their tokens and contrast |
| Components.dc.html | Foundations | Button, Alert (page states), Toast (action feedback, shown live in the corner), Input and FormField, Card, Spinner |
| Main.dc.html | Auth | Desktop sign in / create account, split layout with the painting panel (interactive tabs; Sign in shows the error toast) |
| Mobile.dc.html | Auth | Mobile sign in, painting as a top banner |
| MobileNepali.dc.html | Auth | The mobile sign in in Nepali |
| CheckEmail.dc.html | Auth | "Check your email" card with the drummer-and-dancer illustration |
| HomeDesktop.dc.html | Home | Desktop home: illustrated hero with the introduction and a latest-news panel (headlines only), family-tree search, gallery albums with "View all galleries", upcoming events, membership band, footer |
| HomeMobile.dc.html | Home | The same home page at phone width (news below the hero, 2-column gallery) |
| SignInModal.dc.html | Home | Modal pattern: sign in over the home page, Faktanglung photo under a light layer as the modal background (interactive tabs; Sign in shows the error toast) |
| SiteHeader.dc.html | Foundations | Shared header for inner pages (`active` page; signed-in variant); every page board imports it |
| SiteFooter.dc.html | Foundations | Shared footer imported by every inner page |
| FamilyTree.dc.html | Family tree | Search (name, father's name, village; ancestors only), results, family branches, "Claim your record" |
| TreeView.dc.html | Family tree | Male-line tree, 4 generations, click a person for the side panel; living people show as locked "Private" cards |
| PersonProfile.dc.html | Family tree | Ancestor profile: names in English and Nepali, fuzzy BS/AD dates, life story, sources, photos and documents, family (living sons private) |
| About.dc.html | About & boards | Who we are, what we do, the seal's symbols, the Sangh's milestones (bracketed items need the Sangh's facts) |
| Boards.dc.html | About & boards | Central board highlight, regional boards with their gaau committees, advisory council |
| BoardDetail.dc.html | About & boards | One board: term tabs, office-bearers, members with how they were appointed, changes during the term |
| News.dc.html | News, events & gallery | Pinned notice, type tabs, featured article, article grid, heritage topics (C-7), pagination |
| Article.dc.html | News, events & gallery | Article: author and BS date, figure with caption, pull quote, linked ancestors, tags, share, related |
| Events.dc.html | News, events & gallery | Upcoming / Past tabs (interactive), category chips, events grouped by BS month with status badges |
| EventDetail.dc.html | News, events & gallery | Event: status, programme, BS and AD date, venue, organisers, add to calendar, last year's album |
| Gallery.dc.html | News, events & gallery | Album grid with event / year / place / category filters |
| Album.dc.html | News, events & gallery | Album header, photo mosaic, add your photos |
| PhotoViewer.dc.html | News, events & gallery | Full-screen viewer: caption, date taken, place, credit, tagged people visible to branch members only |
| Account.dc.html | Account & system | My account: profile, identity claim progress, branch access, my submissions, signed-in devices |
| NotFound.dc.html | Account & system | Page not found with search |

## Uploaded images

The canvas refers to images as `/_blob/<id>`. Only images cleared for use go here (the repository is public); see the Imagery section of the design system.

| Canvas id | File |
|---|---|
| a7168cfe4f6cf50d4b9dd3fb80c1aede | assets/yakthung-cheli-painting.jpg |
| 12900056d369d64821ae35fdc1adb0c2 | assets/yakthung-pair-illustration.jpg |
| 72ac33c727f15acdcad8b8577fe86042 | assets/silam-sakma.png |
| 74d1d53640bbc4c25d8e208c90d53ca4 | `apps/web/public/brand/logo.jpg` (the seal) |
| e43ef7d099b4aae609414fa54186664b | assets/phaktanglung-village.svg (original illustration) |
| cd11962e7d1b5da2ea5327e82bf85c9f | assets/chyabrung-dance.svg (original illustration) |
| 968633793a1b2182437b3c75ef7c906c | assets/three-generations.svg (original illustration) |
| 80254a1ec7a3e1f1307fb2d1e7827958 | Faktanglung photo for modal backgrounds — **not in the repo yet**: source and licence to confirm |
