# Starts with a lightweight Node.js image.
FROM node:22-alpine 

# Sets /app as the working directory inside the container.
WORKDIR /app

# Copies package.json and package-lock.json.
COPY app/package*.json ./

# Installs Express and other production dependencies.
RUN npm install --omit=dev

# Copies your application code: into the container.
COPY app/ .

# Documents that our application listens on port 3000.
EXPOSE 3000

# Starts the Node.js application when the container runs.
CMD ["node", "server.js"]