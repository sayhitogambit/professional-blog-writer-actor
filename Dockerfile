# Use the official Apify Node.js image
FROM apify/actor-node:22

# Copy all files to the container
COPY . ./

# Install dependencies
RUN npm install --production

# Run the actor
CMD ["npm", "start"]
