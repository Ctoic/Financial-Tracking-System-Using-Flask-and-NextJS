FROM node:18-bullseye-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Verify build output
RUN ls -la .next/ && echo "Build completed successfully"

EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
