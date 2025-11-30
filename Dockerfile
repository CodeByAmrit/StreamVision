# ------------ BASE STAGE ------------
FROM node:20-slim AS base
WORKDIR /usr/src/app

# Install only required runtime packages (ffmpeg minimal)
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# ------------ FINAL STAGE ------------
FROM node:20-slim

WORKDIR /usr/src/app

# Copy ffmpeg binary from base image (much smaller)
COPY --from=base /usr/bin/ffmpeg /usr/bin/
COPY --from=base /usr/lib/ /usr/lib/

# Copy node_modules from base stage
COPY --from=base /usr/src/app/node_modules ./node_modules

# Copy application code
COPY . .

# Create non-root user
RUN useradd --user-group --create-home --shell /bin/false appuser && \
    mkdir -p /usr/src/app/logs && \
    chown -R appuser:appuser /usr/src/app

USER appuser
EXPOSE 3000

CMD ["node", "app.js"]
