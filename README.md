# BeeBites · بي بايتس

Arabic-first, RTL home bakery storefront built with React 19, TypeScript 6, Vite 8, Tailwind CSS 4 and Motion. Sanity manages the menu and site settings. Orders are composed locally and sent through WhatsApp; there is no payment or checkout service.

## Run locally

Use Node.js 22.12+ and npm. TypeScript and ESLint retain the repository's original versions.

```bash
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:4000`. Development and local production preview both use port 4000 with strict port selection, so stop the other server first if the port is occupied. Without Sanity credentials, the site displays the complete 13-product fallback menu. Missing product photos use a clearly labeled honeycomb SVG. Failed CMS requests also fall back silently. A successfully fetched empty menu stays empty.

**Add the original logo to `public/logo.jpg`.** That file was absent from the supplied checkout. The app references it without redrawing it, and displays a plain BeeBites wordmark if it is missing. The same file is used for the favicon and default social preview.

## Environment variables

Root `.env`:

```dotenv
VITE_SANITY_PROJECT_ID=your-project-id
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2026-01-01
```

Use your actual project ID. These variables are public browser configuration, not secrets. Never add a Sanity write token to a `VITE_` variable. Restart Vite after changing them; production changes require rebuilding.

Production builds automatically load the committed `.env.production`, which points to BeeBites' public Sanity project `5uk93lcn` and its `production` dataset. This keeps deployed builds connected to the menu when the hosting provider has no build variables configured. Hosting build variables and `.env.production.local` can override these public defaults; Worker runtime variables do not change the compiled storefront. Keep secrets in ignored local environment files or the hosting provider's secret settings.

Studio has its own environment:

```bash
npm --prefix studio ci
cp studio/.env.example studio/.env
```

Set `SANITY_STUDIO_PROJECT_ID` to the same project ID and `SANITY_STUDIO_DATASET=production` in `studio/.env`. Then, from the repository root:

```bash
npm run studio
```

Studio uses `SANITY_STUDIO_*` variable names, not the storefront's `VITE_SANITY_*` names. After editing `studio/.env`, stop the running Studio with Ctrl+C and run `npm run studio` again so it reloads the environment.

Studio normally opens at `http://localhost:3333`. It requires a real project ID and a Sanity login. `studio/` has its own package manifest and lockfile; it is not bundled into the storefront.

## Create the public dataset and import the menu

Create a project in [Sanity Manage](https://www.sanity.io/manage), then run from `studio/`:

```bash
npx sanity login
npx sanity dataset create production --visibility public
npx sanity dataset import seed/menu.ndjson production
```

If the dataset already exists, skip creation. Confirm or change its visibility with `npx sanity dataset visibility get production` / `npx sanity dataset visibility set production public`. Public reads are necessary for the token-free CDN client. Visibility is a project-side setting and cannot be enforced by a frontend configuration file. See the [Sanity dataset documentation](https://www.sanity.io/docs/cli-reference/cli-datasets).

The import contains two categories, 13 products and the `siteSettings` singleton. The root shortcut is `npm run studio:seed -- production`. Import into an empty dataset initially. To intentionally refresh existing seed documents, add `--replace`; this overwrites edits to documents with matching IDs. `npm run seed:generate` regenerates the NDJSON from `src/data/fallbackMenu.ts`.

## Editing content

- Studio shows only **حلو** and **مالح**. Create products from either list; the category is selected automatically. You can change it using the product's **القسم** choice. Separate category documents are no longer required.
- Edit names, subtitles, prices, photos, descriptions and badges. Keep **إظهار المنتج في الموقع** enabled and click **Publish** to show the product. Drafts do not appear. `comingSoon` keeps a published product visible with ordering disabled.
- **Ordering:** change a product's numeric `order` field and publish; lower numbers appear first inside its category. Studio opens products in this order.
- Product images support hotspot cropping and are requested from Sanity at 320/640px with automatic image format. Upload the original logo without redesigning it.
- Existing site settings are still read from `siteSettings`, with local defaults for missing values. Settings and category management are hidden from Studio's product workflow.
- **ليش بي بايتس؟** is static. Edit its three cards in `src/data/about.ts`; CMS About card edits are ignored by the website.
- The hero previews up to three orderable products from the same published menu. Uploaded photos take priority, with both حلو and مالح represented when photos are available. Clicking a preview jumps to that product's quantity controls in the menu. Hidden and coming-soon products are excluded; missing photos use the labeled placeholder.

The local development site reads published content through Vite's `/api/sanity` proxy, bypassing browser CORS and CDN caching. It checks for menu changes every five seconds while visible and when you return to the tab. Restart `npm run dev` after changing Vite configuration. Production builds read through Sanity's CDN and refresh when you return to the tab; their origins still need Sanity CORS access.

Old category references remain readable. For older products, choose **حلو** or **مالح** before publishing again; this also removes the old reference. Products missing a category appear under **حلو** until assigned. Existing carts use current product prices and discard hidden, removed or coming-soon products. Quantities are capped at 99 per product. Browser storage failures do not prevent ordering.

The placeholder number `9627XXXXXXXX` deliberately disables WhatsApp links. Replace it with the bakery's international number, digits only (no `+` or spaces). Orders include each item's name/subtitle, quantity, line price and total; the customer sends the message manually.

## CORS

In Sanity Manage → project → API settings → CORS Origins, add the exact origins you use:

| Origin | Allow credentials |
| --- | --- |
| `http://localhost:4000` | No — storefront reads only |
| `http://localhost:3333` | Yes — Studio login |
| Your deployed storefront origin | No |
| Your deployed Studio origin | Yes |

Add `http://127.0.0.1:4000` separately if used; ports and hosts are distinct origins. An entry for `localhost:3333` or `localhost:5173` does not authorize `localhost:4000`. Add preview deployment origins as needed. See [Sanity CORS documentation](https://www.sanity.io/docs/content-lake/cors).

For the local storefront, run this once from the repository root while logged in to the Sanity CLI:

```bash
npm run studio:cors
```

This runs `sanity cors add http://localhost:4000 --no-credentials` using the project configured in `studio/.env`. If login is required, run `npx sanity login` from `studio/`, then rerun the command. Alternatively, add the exact origin in [this project's API settings](https://www.sanity.io/manage/project/5uk93lcn/api) and leave **Allow credentials** unchecked. Reload the storefront after saving.

A CORS error or `403 Forbidden` in `useMenu`/`useSiteSettings` means the browser could not read the CMS; the local fallback may still render. The Vite development proxy avoids browser CORS locally; production builds and `npm run preview` still require project CORS configuration. If a 403 remains, confirm the configured `production` dataset exists and has **Public** visibility. This storefront does not use an authentication token.

### Published products missing from the website

Studio uses your Sanity login; the website reads anonymously. Deploying Studio or publishing a product does not grant anonymous access to a private dataset. From `studio/`, enable the intended public menu access:

```bash
npx sanity dataset visibility set production public
npx sanity dataset visibility get production
```

Refresh `http://localhost:4000`. To check a specific published product, open `/api/sanity/v2026-01-01/data/doc/production/PRODUCT_ID` on that local origin. A response containing `"omitted":[{"id":"...","reason":"permission"}]` confirms that Sanity denied the anonymous read, even if the response status is 200. Once access is fixed, `documents` contains the product. Opening the remote API directly while signed in can use your Sanity session, so it does not prove that anonymous reads are allowed.

## Build and verify

```bash
npm run lint
npm run build
npm test
npm run studio:typecheck
npm run studio:build
npm run preview
```

`build` retains `tsc -b && vite build`, checks strict app/test/config types, and writes `dist/`. Studio builds to `studio/dist/` and requires its environment variables. Unit tests cover cart validation, pricing, Arabic messages, URL safety and fallback/seed consistency.

Optional browser checks:

```bash
npx playwright install chromium
npm run test:browser
```

The browser suite starts its own local server on port 4175 and mocks Sanity. It covers loading/fallback, CMS updates, cart persistence/reconciliation, dialog focus, navigation, RTL/LTR positioning, reduced motion, blocked storage and responsive widths. Screenshots go to ignored `test-results/`. It requires an environment that permits a local listening socket and Chromium subprocesses.

## Deploy

**Cloudflare Workers:** connect this repository and the `main` branch in Workers & Pages. Keep the root directory at the repository root, use build command `npm run build`, and deploy command `npx wrangler deploy`. The committed `wrangler.jsonc` sets the Worker name to `beebites`, pins the required compatibility date, and serves Vite's `dist/` output. Existing deploy commands that also pass `--name beebites --assets ./dist` work with the same configuration. Use Node.js 22.12+ (for example, build variable `NODE_VERSION=22`). The committed `.env.production` supplies the storefront's public Sanity configuration. To override it, use **Settings → Build → Build Variables and Secrets**, then trigger a new build. Settings changes apply to the next build; deploying an existing version reuses its compiled assets.

To validate the Cloudflare deployment configuration locally without publishing, run `npm run build` followed by `npx wrangler deploy --dry-run`.

**Cloudflare Pages:** import this repository, choose React (Vite), keep the repository root, and use build command `npm run build` with output directory `dist`. The same committed production configuration is loaded automatically.

**Vercel:** import this repository, choose Vite, keep the root directory at the repository root, set build command `npm run build` and output directory `dist`. The committed production configuration supplies the Sanity defaults; optional `VITE_SANITY_*` build variables override them.

**Netlify:** use `npm run build` and publish directory `dist`, with the same production configuration and optional build variable overrides. `netlify.toml` provides these build defaults. No router rewrites are needed; sections use anchors.

After deployment, register the storefront origin in Sanity CORS. Content changes only require publishing in Studio and reloading the page; no frontend deployment is needed.

**Studio:** with `studio/.env` configured, run:

```bash
cd studio
npm run deploy
```

This invokes `sanity deploy`. Choose an available Studio hostname when prompted, then register/verify its CORS origin with credentials. Studio deployment and frontend deployment are separate. No live Sanity project, dataset or deployment was created by this implementation.

Before sharing publicly, set `og:image` in `index.html` to the absolute deployed logo URL (for example, `https://your-domain.com/logo.jpg`). The browser also updates that tag to the CMS logo, but social crawlers may not execute JavaScript. The page includes Arabic metadata, dynamic Bakery JSON-LD and the exact dynamic copyright line.

## Project layout

- `src/components/`: storefront, decorative SVGs, accessible navigation and cart dialog.
- `src/hooks/`: menu/settings fetching and persisted cart state.
- `src/lib/`: typed Sanity client/GROQ queries, image URLs, prices and messages.
- `src/data/fallbackMenu.ts`: offline content and seed source.
- `studio/schemaTypes/`: category, product and singleton site settings schemas.
- `studio/seed/menu.ndjson`: importable content without fabricated product photos.

## Replace before launch

1. Real Sanity project ID in both environment files; confirm the dataset name.
2. `9627XXXXXXXX` with the real WhatsApp number in Studio (and the fallback/seed source for offline use).
3. The 13 labeled photo placeholders with actual product photos in Studio.
4. Add the missing original `public/logo.jpg`; optionally upload the same original in Studio.
5. Set the absolute production logo URL in `index.html` for Open Graph sharing.
6. Review the default order-in-advance note, greeting and social links for your business.

If fallback content is changed, run `npm run seed:generate` to keep the import file synchronized. Reimport only when you intend to update CMS documents.
