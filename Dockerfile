# --- Stage 1: Build Web (React/Vite) ---
FROM node:22-alpine AS web-builder

WORKDIR /app
# 종속성 캐시 최적화
COPY web/package.json web/package-lock.json* web/ ./
RUN npm ci

# 소스 복사 후 빌드
COPY web/ ./
# Vite 환경변수는 빌드 타임에 주입 가능(e.g. --build-arg VITE_POCKETBASE_URL)
ARG VITE_POCKETBASE_URL
ENV VITE_POCKETBASE_URL=${VITE_POCKETBASE_URL}
RUN npm run build

# 산출물: /app/dist


# --- Stage 2: Build Go Server ---
FROM golang:1.25.1-alpine AS go-builder

# go build를 위한 기본 준비
RUN apk add --no-cache git ca-certificates && update-ca-certificates

WORKDIR /build/server

# go mod 캐시 최적화
COPY server/go.mod server/go.sum ./
RUN go mod download

# 서버 소스 복사
COPY server/ ./

# 빌드 파라미터 (필요시 GOARCH 교체)
ARG CGO_ENABLED=0
ARG GOOS=linux
ARG GOARCH=amd64
ENV CGO_ENABLED=${CGO_ENABLED}
ENV GOOS=${GOOS}
ENV GOARCH=${GOARCH}

# 바이너리 이름은 'server'로 가정 (필요시 수정)
RUN go build -trimpath -ldflags="-s -w" -o /out/server .

# --- Stage 3: Runtime (Alpine) ---
FROM alpine:3.20

# 런타임 의존성
RUN apk add --no-cache ca-certificates tzdata \
  && addgroup -S app && adduser -S app -G app

WORKDIR /app

# 데이터 디렉토리 생성 및 권한 설정
RUN mkdir -p /app/pb_data /app/pb_public && chown -R app:app /app

# Go 서버 바이너리
COPY --from=go-builder /out/server /app/server

# 정적 파일: pb_public로 복사 (TRD 시나리오)
COPY --from=web-builder /app/dist /app/pb_public

# 포트 (PocketBase 서버 바인딩: 8080)
EXPOSE 8080

# 권장 환경 변수 (docker-compose나 --env로 주입)
ENV TRANSMISSION_HOST=http://transmission:9091/transmission/rpc
ENV TRANSMISSION_USER=""
ENV TRANSMISSION_PASS=""
# NOTE: COOKIE_SECRET should be provided at runtime via environment, not hardcoded in the image.
# ENV COOKIE_SECRET=
ENV CLIENT_ORIGIN=http://localhost:8080

USER app

# 서버 실행 (PocketBase serve, 0.0.0.0:8080 바인딩)
CMD ["/app/server", "serve", "--http=0.0.0.0:8080"]