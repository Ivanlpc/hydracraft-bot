FROM node:24.22.2-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run check && npm prune --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:24.22.2-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json package-lock.json index.js CommandManager.js Embeds.js ./
COPY --chown=node:node api ./api
COPY --chown=node:node buttons ./buttons
COPY --chown=node:node commands ./commands
COPY --chown=node:node config ./config
COPY --chown=node:node events ./events
COPY --chown=node:node select_menus ./select_menus
COPY --chown=node:node util ./util
RUN mkdir logs charts && chown node:node logs charts
USER node
STOPSIGNAL SIGTERM
CMD ["node", "index.js"]
