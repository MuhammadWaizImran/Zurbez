# ZURBEZ

ZURBEZ is a Node.js storefront and admin portal. It includes eight product collections, product videos, a one-time intro, cart and wishlist, cash-on-delivery checkout, stock management, reviews, and website settings.

## Local development

Use Node.js 20 or newer:

```bash
npm ci
npm start
```

Open `http://127.0.0.1:4173/` for the storefront and `http://127.0.0.1:4173/admin` for the admin portal. Run `npm run check` and `npm test` before committing changes. `npm run bundle:upload` rebuilds the browser upload bundle after changes to `admin-upload-entry.js`.

The local server creates `private-data/store.json` from `seed-products.json` on first start. The seed sets hoodie stock to zero. Later product, inventory, order, review, subscriber, and settings changes are saved to that private file. Admin uploads go to `assets/uploads/`. Neither path belongs in Git. The browser stores only cart and wishlist state locally.

## Hosting and configuration

The existing Vercel project serves `/admin` through `admin.html` and API routes through `api/index.js`. Its store data and uploaded media use private Vercel Blob storage. Set `ZURBEZ_SESSION_SECRET` and the Vercel Blob token in the Vercel project environment. The production Blob object `zurbez/store.json` must exist; a source-code push alone does not create or update it. Local and hosted store data are separate.

The admin account uses the fixed username `zurbez_admin`. Its salt and password hash are private configuration, never source code. Locally, keep them in ignored `private-data/admin-credentials.json` as `{ "username": "zurbez_admin", "salt": "...", "hash": "..." }`. On Vercel, set `ZURBEZ_ADMIN_SALT` and `ZURBEZ_ADMIN_HASH` as project environment variables before deploying this version; the existing private values must be copied there. Keep the plaintext password outside this repository. Use the admin portal to update stock and website copy. Do not commit `.env.local`, `.vercel`, `private-data`, uploaded media, or customer exports.

This repository is source control, not an automatic production release. Preview changes locally and deploy only after approval. GitHub pushes do not automatically change the live store unless a deployment integration is separately enabled.

## Main files

- `index.html`, `app.js`, `storefront-sync.js`, `styles.css`, `theme-zurbez.css`: storefront.
- `loader-boot.js`, `loader.js`, `loader.css`: first-visit animation.
- `admin.html`, `admin.js`, `admin.css`, `admin-upload.js`: admin portal. `admin-upload.js` is generated from `admin-upload-entry.js` and is needed at runtime.
- `server.js`, `api/index.js`: local API and Vercel API.
- `seed-products.json`: initial catalogue only. Saved inventory lives outside Git.
- `assets/products/`, `assets/video/`, `assets/zurbez/`: product images, films, and brand artwork used by the storefront.

The store accepts cash-on-delivery orders. It does not process card payments or send automated order emails. Contact details and final returns/privacy policies must be completed before a public launch. Some catalogue images are placeholders; verify rights to all product imagery before publication.
