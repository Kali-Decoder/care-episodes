# Care Episode Agent — Cloud Run container.
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    UPLOAD_DIR=/tmp/uploads \
    STORE_BACKEND=firestore

WORKDIR /app

# Install deps first so the layer caches across code changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cloud Run injects PORT (defaults to 8080). Shell form so ${PORT} expands.
EXPOSE 8080
CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
