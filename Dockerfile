# Step 1: Build React app
FROM node:18 AS build

WORKDIR /app

# package files copy
COPY package*.json ./

# dependencies install
RUN npm install

# project copy
COPY . .

# build React app
RUN npm run build


# Step 2: Serve with nginx
FROM nginx:alpine

# build folder copy to nginx
COPY --from=build /app/build /usr/share/nginx/html

# expose port
EXPOSE 3000

# start nginx
CMD ["nginx", "-g", "daemon off;"]