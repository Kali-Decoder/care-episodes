#!/usr/bin/env bash
# Deploy the Care Episode Agent to Cloud Run + wire the Cloud Scheduler tick.
# Run from backend/. Requires: gcloud auth login, gcloud config set project, and
# the APIs already enabled (they are — see docs/status.md).
#
# This is not run automatically — read it, then run it yourself (or `! bash deploy.sh`).
set -euo pipefail

PROJECT="care-episode-agent"
REGION="asia-south1"                 # Firestore + Cloud Run region
SERVICE="care-episode-agent"
SA="care-agent-sa@${PROJECT}.iam.gserviceaccount.com"

gcloud config set project "$PROJECT"

# --- 1. Build + deploy the service ------------------------------------------
# --no-cpu-throttling: BackgroundTasks need CPU after the response returns.
# --max-instances 5 + a $50 budget alert: guardrails against runaway cost (§6.7).
# --allow-unauthenticated: the static frontend calls this from the browser with
#   no user auth (scope cut). Cap instances, set the budget alert, and TEAR DOWN
#   after recording the demo. Alternatively require auth and use a proxy/token.
gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --service-account "$SA" \
  --no-cpu-throttling \
  --max-instances 5 \
  --allow-unauthenticated \
  --quiet \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT},GOOGLE_CLOUD_LOCATION=${REGION},VERTEX_MODEL_FAST=gemini-3.5-flash,VERTEX_MODEL_SMART=gemini-3.1-pro-preview,VERTEX_MODEL_SMART_LOCATION=global,ADK_LOCATION=global,STORE_BACKEND=firestore,UPLOAD_DIR=/tmp/uploads,PATIENT_LAT=22.5808,PATIENT_LNG=88.4258,NOTIFY_EMAIL=shekharshashank1211@gmail.com,DOCUMENTS_BUCKET=care-episode-agent-documents" \
  --set-secrets "PLACES_API_KEY=places-api-key:latest,OAUTH_CREDENTIALS_JSON=google-oauth-credentials:latest"

URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"
echo "Service URL: $URL"
echo "Give Neeraj: NEXT_PUBLIC_API_BASE_URL=$URL  and set NEXT_PUBLIC_USE_MOCKS=false"

# --- 2. Cloud Scheduler -> /api/tick ----------------------------------------
# DEMO_MODE cadence (build-plan §16): every 60s. In production this would be 6h.
# OIDC auth so only the scheduler can call /api/tick.
gcloud scheduler jobs create http care-episode-tick \
  --location "$REGION" \
  --schedule "* * * * *" \
  --uri "${URL}/api/tick" \
  --http-method POST \
  --oidc-service-account-email "$SA" \
  || gcloud scheduler jobs update http care-episode-tick \
       --location "$REGION" \
       --schedule "* * * * *" \
       --uri "${URL}/api/tick" \
       --http-method POST \
       --oidc-service-account-email "$SA"

echo "Done. Pause the scheduler when not demoing:  gcloud scheduler jobs pause care-episode-tick --location $REGION"
