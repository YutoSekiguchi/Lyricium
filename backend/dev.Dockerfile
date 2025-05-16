FROM python:3.12-alpine

WORKDIR /app

COPY requirements.txt .
# コンテナ内で必要なパッケージをインストール
RUN apk add --no-cache mariadb-dev  gcc libc-dev

RUN apk add --no-cache build-base \
&& pip install --no-cache-dir --trusted-host pypi.python.org -r requirements.txt \
&& apk del build-base

COPY . .

EXPOSE 8000
# FastAPIを8000ポートで待機
CMD sh -c "uvicorn main:app --reload --host 0.0.0.0 --port 8000"