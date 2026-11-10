# Design

Two artifacts in Claude hold the design. This folder mirrors the canvas so code can be built from it.

| Artifact | What it holds | How it changes |
|---|---|---|
| [Sambahamphe Utthan Sangh — Website](https://claude.ai/artifact/QSrUga2EwkNi7L9ekh21bw) (Design canvas) | Every screen, plus the Colours and Components boards. Pages: Foundations, Auth. | Design on the canvas, then run `/sync-design` to pull it into `canvas/`. |
| [Sambahamphe Utthan Sangh](https://claude.ai/artifact/M6XNXUjVwWnxJXygH6zTak) (Design System) | Tokens, the `@repo/ui` components with live previews, the brand guide and approved images. The canvas installs a copy of it. | Generated from `packages/ui`. Change the code, then ask Claude to re-sync the design system and refresh the canvas copy. |

The canvas is the source of truth for screens. Don't edit `canvas/` by hand; change the canvas and sync.

## Design rules

These apply to every board and to the code built from it.

- **Messages never resize their container.** A form, card or modal that can show a success or error message has that space from the start: every field keeps one line under it for its hint or error, and a failed action shows a toast (bottom-right; full width on phones), which floats over the page. A state that replaces the content (a missing link, "email confirmed") may use an Alert.

## Canvas boards

| File | Page | What it shows |
|---|---|---|
| Colours.dc.html | Foundations | Brand, neutral and status colours with their tokens and contrast |
| Components.dc.html | Foundations | Button, Alert (page states), Toast (action feedback, shown live in the corner), Input and FormField, Card, Spinner |
| Main.dc.html | Auth | Desktop sign in / create account, split layout with the painting panel (interactive tabs; Sign in shows the error toast) |
| Mobile.dc.html | Auth | Mobile sign in, painting as a top banner |
| MobileNepali.dc.html | Auth | The mobile sign in in Nepali |
| CheckEmail.dc.html | Auth | "Check your email" card with the drummer-and-dancer illustration |

## Uploaded images

The canvas refers to images as `/_blob/<id>`. Only images cleared for use go here (the repository is public); see the Imagery section of the design system.

| Canvas id | File |
|---|---|
| a7168cfe4f6cf50d4b9dd3fb80c1aede | assets/yakthung-cheli-painting.jpg |
| 12900056d369d64821ae35fdc1adb0c2 | assets/yakthung-pair-illustration.jpg |
| 72ac33c727f15acdcad8b8577fe86042 | assets/silam-sakma.png |
| 74d1d53640bbc4c25d8e208c90d53ca4 | `apps/web/public/brand/logo.jpg` (the seal) |
