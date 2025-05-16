# スリムでセキュリティに優れたベースイメージ
FROM python:3.12-alpine

# 作業ディレクトリの設定
WORKDIR /app

# 依存関係ファイルをコピー
COPY requirements.txt .

# 必要なパッケージと依存関係のインストール
RUN apk add --no-cache mariadb-dev gcc libc-dev \
    && apk add --no-cache build-base \
    && pip install --no-cache-dir -r requirements.txt \
    # ビルド完了後に不要なパッケージを削除してイメージを軽量化
    && apk del build-base

# アプリケーションのコードをコピー
COPY . .

# 8000ポートを公開
EXPOSE 8000

# FastAPIアプリケーションを実行
# Gunicornを使用して複数のワーカーでアプリケーションを実行
CMD ["sh", "-c", "gunicorn -w 6 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000"]