FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=http://fastapi:80
ARG VITE_BUILDING_NAME=Heafey
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BUILDING_NAME=$VITE_BUILDING_NAME
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
