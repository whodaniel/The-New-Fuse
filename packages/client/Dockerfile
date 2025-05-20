FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json .
COPY packages/client/package.json ./packages/client/
RUN yarn install
COPY . .
RUN yarn workspace @the-new-fuse/client build

FROM nginx:alpine
COPY --from=builder /app/packages/client/build /usr/share/nginx/html
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
