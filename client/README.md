# Care Episode Agent — Frontend (`client/`)

Patient UI for the Care Episode Agent — upload a prescription and follow your care episode as AI agents handle labs, results, and findings.

## Run locally

```bash
cd client
cp .env.example .env.local
npm install
rm -rf .next   # if dev 500 after a production build
npm run dev
```

Open [http://localhost:3000/welcome](http://localhost:3000/welcome)

## Env

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_USE_MOCKS` | `true` | Mock API + in-memory episodes |
| `NEXT_PUBLIC_API_BASE_URL` | `` | Backend base URL when mocks off |

## Routes

| Path | Screen |
|------|--------|
| `/welcome` | Product landing — how Care Episode works |
| `/dashboard` | **Your dashboard** — uploads, history, active episodes |
| `/dashboard/episode?id=…` | **Episode view** — timeline hero + cards |
| `/settings` | Account settings |

Legacy MedLifeSim screens remain in the codebase under `/chat`, `/start-simulation`, etc. but are not linked in navigation.

## Mock cycler

On any episode page (bottom-right): **Auto-cycle states** steps through all 12 contract states without a backend.

Demo patient: `demo-patient-01`. Preloaded episode: `ep_7f3a9c` (`AWAITING_REPORT`).

## Firebase Hosting

```bash
npm run build   # outputs to out/
firebase deploy --only hosting
```

See `firebase.json`.

## Contract

Frozen shapes in [`api-contract.md`](./api-contract.md). Mock JSON in `public/mocks/`.
