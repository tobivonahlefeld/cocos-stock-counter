# Bar Stock Counter

A phone-friendly React app for counting missing drinks during a shift and using the same list as a basement restock list.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL Vite prints in the terminal.

## Use on iPhone

Deploy the app to a static host such as Netlify, Vercel, Cloudflare Pages, or GitHub Pages. Open the hosted link once on your iPhone, then use Safari's share button and choose "Add to Home Screen".

After the first successful load, the app keeps an offline copy. Counts and custom drinks are saved on that device with `localStorage`.

## Features

- Drinks stay in the exact basement order from the request.
- Plus and minus buttons update each drink count.
- Counts never go below zero.
- Reset clears all counts back to zero.
- Search filters the drink list.
- The "Show only needed" toggle turns the list into a restock list.
- New drinks can be added at the bottom.
- Counts and custom drinks are saved in `localStorage`.
- The app can be installed to a phone Home Screen and used offline after first load.
