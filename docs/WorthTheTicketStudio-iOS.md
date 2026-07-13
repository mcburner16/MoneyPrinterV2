# Worth the Ticket? Studio Dashboard iPhone Access

The Studio Dashboard is a web app, so an iPhone can open it in Safari after the app is hosted somewhere public or private. If you do not have access to a computer, do not try to run the local development server. Deploy it from your phone instead.

## Fastest no-computer path: Vercel from iPhone

1. Push this repository branch to GitHub.
2. On your iPhone, open Safari and go to `https://vercel.com/new`.
3. Sign in with GitHub.
4. Import the `MoneyPrinterV2` repository.
5. Keep the default Next.js settings:
   - Framework preset: `Next.js`
   - Install command: `npm install`
   - Build command: `npm run build`
   - Output directory: leave blank/default
6. Tap **Deploy**.
7. Open the Vercel URL on your iPhone.
8. In Safari, tap **Share** → **Add to Home Screen**.

## What to expect on iPhone

- The dashboard is mobile-friendly and runs in Safari.
- Movie Log data is currently saved in that browser using local storage.
- Data entered on your iPhone stays on that iPhone browser unless a database-backed sync feature is added later.
- If you clear Safari website data, the local Movie Log entries can be deleted.

## Best next upgrade

For daily iPhone-only use, the next build should replace browser-only local storage with a hosted database such as Vercel Postgres, Supabase, Turso, or another SQLite-compatible hosted option. That would let your phone keep the same movie log across devices and browser sessions.
