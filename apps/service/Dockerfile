FROM node:lts-alpine

# Essentials
RUN apk update && apk upgrade && \
    apk add -U tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      xvfb \
      curl && \
    rm -rf /var/cache/apk/*


# Set the timezone
ENV TZ="Asia/Shanghai"
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/lib/chromium/chrome


# workdir
WORKDIR /app
ADD dist/ ./ 
COPY package*.json ./
COPY startup.sh ./
COPY build-prod.js ./

# Set the DISPLAY environment variable & Start xvfb
# RUN Xvfb :10 -screen 0 1920x1080x16 & 


RUN npm install -g pnpm && \
    node ./build-prod.js && \
    pnpm install --ignore-scripts && \
    chmod a+x ./startup.sh


EXPOSE 3000
ENTRYPOINT ["./startup.sh"]
