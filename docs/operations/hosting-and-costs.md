# Hosting Plan & Running Costs

Status: **Proposal for the organization** · Prices checked 2026-11-07 · Answers requirements Q-9 and Q-16

Assumption: **500–800 registered users in year 1**, mostly in Nepal, with a smaller diaspora. That is a small load: a single small server is plenty, and most of the cost is the server itself.

Prices are in US dollars unless noted. NPR conversions use **≈ NPR 140 per USD**; check the current rate. Third-party prices change, so re-check each one on the provider's site before paying.

---

## 1. What the platform needs

| Need | What we use | Why |
|---|---|---|
| Server running the website, admin, API, database, Redis | 1 virtual server (VPS) with Docker | Simplest setup that fits our size (system-design §7) |
| Photo/document storage | Cloudflare R2 | 10 GB free, no download (egress) fees |
| CDN, HTTPS, DNS, attack protection | Cloudflare Free plan | Free, and it speeds up pages in Nepal |
| Emails (verification, password reset, notifications) | Resend | Free up to 3,000 emails/month |
| SMS verification codes | Sparrow SMS (Nepal) | Local rates in NPR, paid locally |
| Domain | `.org.np` from Mercantile (the official .np registry) | Free for registered non-profits |
| Backups | Server's daily backup + nightly database copy to R2 | Two independent copies |
| Error alerts & uptime checks | Sentry free plan, UptimeRobot free plan | Free at our size |
| Code hosting & automated tests | GitHub (free) | Free private repositories and CI minutes |

## 2. Three options

### Option A — Recommended: DigitalOcean, Bangalore (India)

The server sits close to Nepal, so pages and admin screens respond quickly. The setup is simple and well documented, and the server can be resized with one click if we grow.

| Item | Monthly | Yearly |
|---|---|---|
| Server: Basic Droplet, 2 vCPU / 4 GB RAM / 80 GB SSD, 4 TB transfer | $24.00 | $288 |
| Daily server backups (30% of server price) | $7.20 | $86 |
| Cloudflare R2 storage (free up to 10 GB; ~$0.015/GB after) | $0 → ~$1 | ~$0–12 |
| Email (Resend free) | $0 | $0 |
| SMS (see §3) | — | ~$40 (one prepaid pack) |
| Domain `.org.np` | $0 | $0 |
| Cloudflare, Sentry, UptimeRobot, GitHub | $0 | $0 |
| **Total** | **≈ $31–32** | **≈ $415–425 ≈ NPR 58,000–60,000** |

### Option B — Lowest cost: Hetzner, Germany/Finland

The same software runs on a server with twice the memory (8 GB) for about a third of the price.

| Item | Monthly | Yearly |
|---|---|---|
| Server: CX33, 4 vCPU / 8 GB RAM / 80 GB, 20 TB traffic | €8.99 | ~€108 |
| Daily backups (20% of server price) | ~€1.80 | ~€22 |
| Everything else as Option A | $0–1 | ~$40 (SMS) |
| **Total** | **≈ $13** | **≈ $190 ≈ NPR 27,000** |

**Trade-offs:**
- **Distance.** The server is in Europe, so each request from Nepal takes roughly 150–200 ms longer. Public pages are cached by Cloudflare, so visitors barely notice. Admin screens and the family-tree explorer feel a little slower.
- **Availability.** On 2026-11-07, Hetzner's site showed these plans as *"currently unavailable"*. Reviews also mention restrictions for new customers, so check that we can actually order one.
- **Prices change.** Hetzner raised prices twice in 2026.
- Hetzner's Singapore location is closer but much more expensive (€26.99 for 4 GB), so it offers no advantage over Option A.

### Option C — Least maintenance: Option A + a managed database

DigitalOcean runs the database for us: updates and automatic backups.

| Item | Monthly |
|---|---|
| Option A | ≈ $31 |
| Managed PostgreSQL, 1 GB RAM / 10 GB storage | $15.15 |
| **Total** | **≈ $47/month ≈ $560/year ≈ NPR 78,000** |

Our database will stay small (well under 1 GB in year 1), so this mainly buys peace of mind. Choose it only if nobody will be responsible for checking backups.

### Recommendation

**Option A.** It is fast for users in Nepal, simple to run, and the yearly cost is predictable at about NPR 60,000. Option B is a good fallback if the budget is tight and Hetzner accepts our order. We can move between providers later, because everything runs in Docker.

## 3. SMS verification (Q-16)

**Recommendation:** Sparrow SMS, paid in NPR. Use SMS only for **Nepali mobile numbers**. Diaspora members verify by **email**, because international SMS costs far more.

| Estimate for year 1 | |
|---|---|
| Sign-ups using a phone number | up to ~800 |
| Codes sent, including re-sends and password resets | ~1,500–2,000 |
| Price per SMS | roughly NPR 0.75–2 depending on pack size (Sparrow says NPR 1–2; third-party sites list packs at NPR 0.75–0.95) |
| Suggested purchase | One 5,000-SMS pack, about NPR 5,000–6,000 incl. VAT. It should last 2+ years |

Sparrow quotes by volume and charges no monthly fee. They will likely ask for the organization's registration documents and a registered sender name. Ask them for a current quote.

## 4. Costs that come later

| When | Item | Cost |
|---|---|---|
| Phase 5 (mobile app) | Google Play developer account | $25 once |
| Phase 5 | Apple Developer Program (needed for the iPhone app) | $99/year. Apple's free waiver for non-profits has only covered a list of countries that did not include Nepal; check eligibility |
| Phase 5 | Expo build service | Free tier is enough at first |
| Only if needed | Second `.org` domain for diaspora familiarity | ~$10–15/year |
| Only if we outgrow 4 GB | Upgrade server to 8 GB (Option A) | +$24/month |

## 5. When the spending starts

- **During development (Phases 1–2):** about $0. Everything runs on the developer's computer with Docker.
- **About 1 month before public launch:** start the server, so we can test on the real setup. A short-lived test server for a few days costs cents, because billing is hourly.
- **Domain:** apply for `.org.np` early. Registration is reported to take up to a month and needs the organization's registration certificate.

## 6. Practical notes for the treasurer

- **Paying foreign providers.** DigitalOcean, Hetzner and Apple charge international cards in USD or EUR. In Nepal this usually needs a dollar or dual-currency card with an annual limit. Another option is a diaspora member paying and being reimbursed. Decide this early.
- **Sparrow SMS and the domain** are paid locally in NPR.
- **Free tiers have limits.** These include Resend's 100 emails/day and R2's 10 GB. We will see in the dashboards long before we hit them.
- **Ownership.** Open every account (cloud, domain, Cloudflare, Sparrow) with an **organization email address**, with at least two committee members having access. Do not use a volunteer's personal account. This protects the platform if people change roles.

## 7. Sources

- [Hetzner Cloud — Cost-Optimized plans](https://www.hetzner.com/cloud/cost-optimized/), [Regular Performance plans](https://www.hetzner.com/cloud/regular-performance/) (viewed 2026-11-07)
- [Hetzner 2026 price increases (Northflank)](https://northflank.com/blog/hetzner-cloud-server-price-increases)
- [DigitalOcean Droplet pricing](https://www.digitalocean.com/pricing/droplets), [Managed Database pricing](https://www.digitalocean.com/pricing/managed-databases) (viewed 2026-11-07)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Resend free tier (Automation Atlas)](https://automationatlas.io/answers/resend-free-tier-explained-2026/)
- [Sparrow SMS FAQ](https://sparrowsms.com/faqs/), [Sparrow: informational SMS pricing](https://sparrowsms.com/blog/informational-sms/), [Bulk SMS cost in Nepal (bulksmsnepal.com)](https://bulksmsnepal.com/cost-of-bulk-sms-in-nepal/)
- [.np registry policy (Mercantile)](https://register.com.np/registry-policy), [.np on Wikipedia](https://en.wikipedia.org/wiki/.np)
- [Apple developer fee waiver countries (MacRumors, 2020)](https://www.macrumors.com/2020/02/03/apple-developer-program-memberships-free-new-countries/)
