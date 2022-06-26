FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 6969:6969

RUN npm install -g tsc
RUN npx prisma generate
RUN npm run build
RUN npm prune --production

CMD ["npm", "run", "launch"]