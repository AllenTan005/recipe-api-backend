# Use Bun official image
FROM oven/bun:1 as base
WORKDIR /app

# 1. Copy package files first (better caching)
# Use bun.lock to match your screenshot
COPY package.json bun.lock ./

# 2. Install dependencies
RUN bun install --frozen-lockfile

# 3. Copy the rest of the source code
COPY . .

# 4. Set Environment to production
ENV NODE_ENV=production

# Render uses the PORT env var automatically, 
# but EXPOSE is good practice for documentation
EXPOSE 3000

# 5. Start the app
CMD ["bun", "run", "src/index.ts"]