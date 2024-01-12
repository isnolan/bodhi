FROM node:lts-alpine

# Essentials
# RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
# RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.cloud.tencent.com/g' /etc/apk/repositories
RUN apk update && apk upgrade

RUN apk add -U tzdata
ENV TZ="Asia/Shanghai"
RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

# Install Chromium
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      xvfb \
      curl

# workdir
WORKDIR /app
ADD dist/ ./ 
COPY package*.json ./
COPY startup.sh ./

# Set the DISPLAY environment variable & Start xvfb
# RUN Xvfb :10 -screen 0 1920x1080x16 & 

# production
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/lib/chromium/chrome
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
RUN npm install --ignore-scripts
RUN chmod a+x ./startup.sh

EXPOSE 3000
ENTRYPOINT ["./startup.sh"]
