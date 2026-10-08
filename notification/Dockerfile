FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node src ./src
RUN mkdir -p logs && chown node:node logs
ENV NODE_ENV=production
ENV PORT=4000
USER node
EXPOSE 4000
CMD ["node", "src/server.js"]
