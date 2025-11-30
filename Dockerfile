# Use a slim, up-to-date base image
FROM node:20-slim

# Create a non-root user (security best practice)
RUN useradd --user-group --create-home --shell /bin/false appuser

# Install ffmpeg only
RUN apt-get update && \
    apt-get install -y ffmpeg --no-install-recommends && \
    apt-get purge -y --auto-remove && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy application
COPY . .

# Create log directory BEFORE switching user
RUN mkdir -p /usr/src/app/logs && \
    chown -R appuser:appuser /usr/src/app

# Switch to non-root user
USER appuser

# Expose app port
EXPOSE 3000

# Run app
CMD ["node", "app.js"]
