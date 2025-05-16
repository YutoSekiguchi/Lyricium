# FROM oven/bun:latest

# WORKDIR /app
# EXPOSE 3000

# COPY package.json ./
# COPY bun.lockb ./

# RUN bun install

# COPY . .

# RUN bun run build

# CMD [ "bun", "start" ]

# ベースイメージとしてNode.jsを使用
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

# # bunのインストール
# RUN npm install -g bun@latest

# Next.jsアプリケーションをビルド
RUN npm run build

# ポートの公開
EXPOSE 3000

# アプリケーションを起動
CMD ["npm", "start"]