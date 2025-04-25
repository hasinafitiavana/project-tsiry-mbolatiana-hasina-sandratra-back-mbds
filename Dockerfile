FROM node:22.14.0-alpine

WORKDIR /app
COPY . .
# Installer les dépendances
RUN npm install

CMD ["node", "server.js"]

# Exposer le port
EXPOSE 8010
