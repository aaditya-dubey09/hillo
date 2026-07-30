# Install bun from the canary channel to get the Mongoose isBuildingSnapshot fix
FROM oven/bun:canary

WORKDIR /app

# build web frontend
WORKDIR /app/web
COPY web/package.json web/bun.lock* ./
RUN bun install --frozen-lockfile
COPY web/ ./

ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN bun run build

# install backend dependencies
WORKDIR /app/backend
COPY backend/package.json backend/bun.lock* ./
RUN bun install --frozen-lockfile
COPY backend/ ./

# expose port
EXPOSE 3000
# set non-sensitive defaults
ENV PORT=3000
ENV NODE_ENV=production

# start the application
CMD ["bun", "index.ts"]
