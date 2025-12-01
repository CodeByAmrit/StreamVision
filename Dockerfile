FROM node:20-slim

# Install ffmpeg and clean up in a single layer
RUN apt-get update && \
    apt-get install -y ffmpeg --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies first to leverage caching
COPY package*.json ./
RUN npm install --production

# Copy the rest of your application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run your app
CMD [ "node", "app.js" ]