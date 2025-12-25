FROM node:24
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate
RUN pnpm config set registry https://registry.npmmirror.com
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN npx prisma generate
RUN pnpm build
EXPOSE 80
CMD ["sh", "-c", "npx prisma migrate deploy && pnpm start"]