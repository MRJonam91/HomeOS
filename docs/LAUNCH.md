# Launch & Promotion Checklist — HomeOS

## Metadata & SEO

- **Repository Name**: `HomeOS`
- **One-line Description** (≤ 350 chars):
  `Local-first home operating system & digital binder: connect room inventories, warranties, appliance manuals, maintenance schedules, and audit trail.`
- **Topics (15)**:
  `homeos`, `home-management`, `digital-binder`, `home-inventory`, `warranty-tracker`, `maintenance-schedule`, `appliance-manuals`, `local-first`, `typescript`, `nodejs`, `cli`, `smart-home`, `property-management`, `home-audit`, `open-data`
- **License**: AGPL-3.0-only (dual licensing with commercial exception)
- **Sponsorships**: Enabled via `.github/FUNDING.yml` (GitHub Sponsors, Ko-fi, Buy Me A Coffee, PayPal)

---

## 🚀 Pre-launch Checklist (Private -> Public)

- [x] Code passes `npm run typecheck`
- [x] Test suite passes `npm test` with 100% green tests
- [x] Core line count guard verified (< 1,500 LOC in `src/core/*.ts`)
- [x] Full unmodified AGPL-3.0 `LICENSE` file present
- [x] `COMMERCIAL-LICENSE.md`, `CLA.md`, `LICENSING.md`, `NOTICE` configured
- [x] Anti-plagiarism markers registered in `_provenance/HomeOS.json` and verified with `verify-markers.mjs`
- [x] Funding metadata configured in `.github/FUNDING.yml` and badges in `README.md` / `README.it.md`
- [x] Interactive vector demo graphic in `docs/assets/demo.svg`
- [x] GitHub repository created as private on `github.com/MRJonam91/HomeOS`
- [x] All commits pushed to `main`

---

## 📢 Announcement Drafts

### Show HN (Hacker News)
> **Title**: Show HN: HomeOS – Local-first home inventory, appliance warranties, and maintenance ledger  
> **Content**:  
> Most households manage appliance manuals, warranties, and maintenance routines with disorganized folders or scattered notes.  
> HomeOS is a local-first, zero-telemetry CLI and engine in TypeScript that models homes into rooms, appliances, warranty expirations, and recurring maintenance checklists. It exports structured bilingual Markdown dossiers for landlords, tenants, or insurance claims.  
> Built strictly under 1,500 LOC for easy hacking and self-hosting.  
> GitHub: https://github.com/MRJonam91/HomeOS

### Reddit (r/selfhosted & r/homelab)
> **Title**: HomeOS: An open-source, local-first digital binder for home maintenance, warranties, and manuals  
> **Content**:  
> Hey r/selfhosted! Tired of lost appliance receipts and forgotten maintenance intervals (boiler anodes, fridge coils, water filters)?  
> I built HomeOS, a local JSON ledger CLI that audits warranty lifecycles, computes recurring maintenance costs, and generates printable Markdown room binders. Zero cloud requirement. Feedback and PRs welcome!

### LinkedIn / X (Twitter)
> Presentiamo **HomeOS** 🏠: il libretto digitale della casa open source e local-first.  
> Collega elettrodomestici, numeri di matricola, manuali PDF, scadenze garanzie e scadenziari di manutenzione programmata (fai-da-te o tecnico) con audit di integrità dei dati.  
> 👉 https://github.com/MRJonam91/HomeOS
