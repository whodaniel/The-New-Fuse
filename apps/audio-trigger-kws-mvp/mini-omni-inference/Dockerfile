FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ffmpeg \
      git \
      libgomp1 \
      libsndfile1 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /srv

RUN git clone --depth 1 --branch main https://github.com/gpt-omni/mini-omni.git /srv/mini-omni

WORKDIR /srv/mini-omni

RUN python -m pip install --upgrade pip setuptools wheel && \
    python -m pip install -r requirements.txt huggingface_hub gunicorn

COPY gunicorn_app.py /srv/mini-omni/gunicorn_app.py

ENV PYTHONPATH=/srv/mini-omni \
    OMNI_DEVICE=cpu \
    OMNI_SKIP_WARMUP=1 \
    OMNI_WHISPER_MODEL=tiny \
    OMNI_WHISPER_DOWNLOAD_ROOT=/tmp/whisper-cache \
    HF_HOME=/tmp/huggingface

EXPOSE 60808

CMD ["sh", "-c", "gunicorn --workers 1 --bind 0.0.0.0:${PORT:-60808} --timeout 1800 gunicorn_app:app"]
