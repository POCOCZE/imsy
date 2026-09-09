# FRONTEND: build react frontend
FROM node:22-slim AS frontend-builder

WORKDIR /app/frontend
COPY ./frontend .

ARG VITE_APP_VERSION
ENV VITE_APP_VERSION=$VITE_APP_VERSION

RUN npm ci && npm run build

# BACKEND: compile source code and static files to one binary
FROM golang:1.27-alpine AS backend-builder

WORKDIR /app/backend

COPY ./backend/self-hosted/go.mod ./backend/self-hosted/go.sum ./
# only for testing locally
COPY ./backend/core/go.mod ./backend/core/go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download && go mod verify

COPY ./backend .

COPY --from=frontend-builder /app/frontend/dist ./core/ui/dist

WORKDIR /app/backend/self-hosted
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux \
    go build -tags production -trimpath -o server .

# FINAL: copy the binary into designated folder
FROM gcr.io/distroless/static-debian13:nonroot
ARG VITE_APP_VERSION
ARG BUILD_DATE
ARG VCS_REF

WORKDIR /app
COPY --from=backend-builder /app/backend/self-hosted/server .

EXPOSE 8080

USER nonroot:nonroot
ENTRYPOINT [ "/app/server" ]