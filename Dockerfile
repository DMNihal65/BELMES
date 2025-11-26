# Use the official Node.js 18 Alpine image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install build tools (for esbuild native binary)
RUN apk update && apk add --no-cache build-base python3

# Copy package.json and package-lock.json for accurate install
COPY package.json ./

# Install all dependencies cleanly
RUN npm install --force

# Copy the rest of your code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
