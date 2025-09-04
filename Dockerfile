FROM node:22.13.0

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

# RUN pnpm build

EXPOSE 5009

CMD ["pnpm", "run","dev"]
