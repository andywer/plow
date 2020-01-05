FROM node:12-alpine AS builder
WORKDIR /build

COPY . .
RUN npm ci
RUN npm run build


FROM node:12-alpine
WORKDIR /app

COPY --from=builder /build /app

RUN ln -s /app/migrate /usr/local/bin/migrate && \
    ln -s /app/seed /usr/local/bin/seed && \
    ln -s /app/migrate+seed /usr/local/bin/migrate+seed

RUN rm -rf ./node_modules
RUN npm install --production

CMD ["/app/migrate+seed"]
