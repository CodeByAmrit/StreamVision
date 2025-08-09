FROM node:slim


# Setting up the work directory
WORKDIR /express-docker

# Copying all the files in our project
COPY . .

# Installing dependencies
RUN npm install

RUN apt-get update && \
    apt-get install -y \
    git \
    ffmpeg \
    libnginx-mod-rtmp \
    build-essential 

# Starting our application
CMD [ "node", "app.js" ]

# Exposing server port
EXPOSE 3000