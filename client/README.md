# Care Episode Agent

Frontend for a patient-facing Care Episode workflow built in Next.js.

The app lets a patient upload a prescription, track the episode through lab discovery and report analysis, and read agent-generated findings in plain language. The UI is built against a frozen API contract and can run fully in mock mode until the backend is ready.

## What the app includes

- `welcome` landing page for the Care Episode product
- patient dashboard with:
  - upload prescription
  - upload history
  - continue active episode
  - needs attention
  - recent conversations
- episode detail page with timeline-driven care state UI
- report upload flow with file upload and camera capture
- mock episode engine for local development and demos

## Tech stack

- Next.js 15
- React 19
- TypeScript
- Framer Motion
- Lucide React

## Getting started

```bash
cd client
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000/welcome](http://localhost:3000/welcome)

If `next dev` starts failing after a production build, clear the build cache and restart:

```bash
rm -rf .next
npm run dev
```

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_USE_MOCKS` | `true` | Uses the in-memory/mock Care Episode API |
| `NEXT_PUBLIC_API_BASE_URL` | empty | Backend base URL when mocks are disabled |

## Main routes

| Path | Purpose |
| --- | --- |
| `/` | Redirects to `/welcome` |
| `/welcome` | Care Episode landing page |
| `/dashboard` | Main patient dashboard |
| `/dashboard/episode?id=...` | Episode detail page |
| `/episode?id=...` | Redirect helper to dashboard episode route |
| `/settings` | Account/settings screen |

Legacy MedLifeSim screens are still present in the codebase for future use and internal access, but the primary product flow is now the Care Episode experience.

## Care Episode flow

The UI is built around the episode lifecycle defined in [`api-contract.md`](./api-contract.md).

Primary states currently handled in the frontend:

- `PRESCRIPTION_RECEIVED`
- `TESTS_IDENTIFIED`
- `LABS_SHORTLISTED`
- `BOOKING_REQUESTED`
- `AWAITING_REPORT`
- `REPORT_RECEIVED`
- `TRENDS_ANALYZED`
- `ANOMALY_FOUND`
- `CONSULT_REQUESTED`
- `NORMAL`
- `CLOSED`
- `NEEDS_HUMAN`

## Mock mode

Mock mode is enabled by default through `NEXT_PUBLIC_USE_MOCKS=true`.

It includes:

- seeded demo episodes
- mock JSON payloads in `public/mocks/`
- dashboard upload flow without a live backend
- auto-cycling state progression on the episode page

Demo patient:

- `demo-patient-01`

Sample preloaded episode:

- `ep_7f3a9c`

## Important files

| Path | Purpose |
| --- | --- |
| `api-contract.md` | Frozen Care Episode API contract |
| `src/care/types.ts` | Frontend Care Episode types |
| `src/care/api.ts` | Care API client and mock/live switching |
| `src/care/pages/CareDashboardPage.tsx` | Main dashboard UI |
| `src/care/pages/CareEpisodePage.tsx` | Episode detail UI |
| `src/care/components/PrescriptionUpload.tsx` | Prescription upload component |
| `src/care/components/UploadHistorySection.tsx` | Dashboard upload history section |
| `src/care/components/CameraCaptureModal.tsx` | Camera capture flow |
| `public/mocks/` | Mock API payloads |

## Build and deploy

### Production build

```bash
npm run build
```

Production builds are configured for static export, so the generated site is written to `out/`.

### Firebase Hosting

```bash
firebase deploy --only hosting
```

Firebase settings live in `firebase.json`.

## Notes

- `next.config.ts` only enables `output: 'export'` in production so local development keeps working.
- The app is currently optimized for the Care Episode product, not the older MedLifeSim navigation.
- The API contract is considered frozen unless both frontend and backend agree on a change.
