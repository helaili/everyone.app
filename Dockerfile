FROM node:12-slim
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --production
RUN npm cache clean --force
ENV NODE_ENV="production"
ENV PORT=8080
EXPOSE 8080
COPY . .
CMD [ "npm", "start" ]
