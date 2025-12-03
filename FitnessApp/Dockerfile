FROM node:18-bullseye
WORKDIR /app

ENV NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false
RUN npm config set fetch-retries 5 && npm config set fetch-timeout 600000

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1 HOST=0.0.0.0
EXPOSE 3000
CMD ["npm","run","dev"]