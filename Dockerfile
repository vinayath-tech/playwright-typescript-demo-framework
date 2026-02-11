FROM mcr.microsoft.com/playwright:v1.58.1-jammy

WORKDIR /app

COPY package*.json /app/
RUN npm ci

COPY . /app

ENV CI=true
CMD ["npm", "run", "test:ui"]