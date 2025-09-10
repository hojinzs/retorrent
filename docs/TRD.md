# Technical Requirements Document (TRD)
## Transmission WebUI Shaded — React.js(Vite) + Go 서버 아키텍처 제안 (PocketBase + React)

작성일: 2025-09-10
작성자: 제안자(귀하의 요청에 따라 작성)

요약
- 주요 결정: 프론트엔드는 React.js(Vite, TypeScript) 단일 페이지 애플리케이션(SPA)로 구성하고, 서버사이드 API와 Transmission RPC 프록시는 별도의 Go 서버에서 처리합니다. PocketBase는 사용자 인증과 간단한 데이터 저장(파일 포함)을 담당합니다. 프론트엔드는 CSR 중심으로 빌드되어 정적 파일로 배포합니다.
- 목표: 온프레미스(홈서버)에서 간편하고 일관성 있게 배포·운영 가능하면서, TypeScript 중심으로 유지보수성을 확보.

---

## 1. 아키텍처 (high level)

Web (React SPA)
  - React + Vite로 빌드된 정적 사이트
  - 브라우저에서 PocketBase 인증(JS SDK) 사용, API 호출은 Go 서버의 /api/*로 수행
Server (Go, PocketBase)
- 사용자 인증, 파일 업로드, 간단 컬렉션 저장
  - SSE(Web events) 또는 WebSocket 지원
  - PocketBase 세션/토큰 검증 수행

---

## 2. 컴포넌트 상세 (React/Go 구성 포인트)

### 2.1 Web (React SPA)
역할
- UI 렌더링(클라이언트) 담당
- 실시간: Server-Sent Events (SSE) 연결

기술 스택
- React.js (TypeScript)
- 인증: PocketBase JS SDK
- 라우팅: TanStack Router
- 상태 관리: React Query (TanStack Query) + Zustand (optional)
- UI: shadcn-ui + Tailwind

### 2.2 Server (Go, PocketBase)
역할
- 사용자 계정, 파일 스토리지, 간단 컬렉션
- Transmission RPC 프록시
운영
- Docker 컨테이너로 배포
- 데이터 위치: services/pocketbase/pb_data (pb_data 볼륨 마운트) — 정기 백업 필요

권장 컬렉션(초안)
- torrents_meta: transmission_id(string), name(string), added_by(user id), tags(array), info(json)

---

## 3. Go 서버 API 스펙 (초안)
(모든 엔드포인트는 서버사이드에서 PocketBase 세션 확인을 수행하고, Transmission 호출 시 서버 내부 credential 사용)

인증
- 로그인 흐름: 클라이언트가 PocketBase 인증을 호출

엔드포인트
- GET /api/torrents
  - query: ?status=all|downloading|seeding
  - response: { items: [ { id, name, status, progress, size, added_by } ] }
  - 구현: Go 서버가 Transmission RPC get-torrent-data 호출 후 필요시 torrents_meta와 join

- POST /api/torrents/add
  - body: { torrent: base64|url, options? }
  - response: { ok: true, transmission_id }
  - 구현: Go 서버가 Transmission RPC "torrent-add"

- POST /api/torrents/:id/action
  - body: { action: 'pause'|'start'|'remove', params? }

- GET /api/stats
  - response: { uploadSpeed, downloadSpeed, totalTorrents, ... }

- GET /api/events (SSE)
  - 실시간 토렌트 상태 푸시
  - 구현 옵션: Go 서버에서 SSE 엔드포인트 제공 또는 별도 WebSocket 서버 구성

Transmission session-id 재시도(서버 로직 요약)
1. 서버가 Transmission에 JSON-RPC 요청을 보냄
2. 409 응답이면 헤더의 X-Transmission-Session-Id를 추출
3. 동일 요청을 새로운 session-id로 재시도(최대 1회)
4. 실패 시 클라이언트에 적절한 에러 반환

보안 관련
- Transmission 자격증명은 서버 환경 변수 또는 로컬 비밀 저장소에 보관
- 클라이언트에는 Transmission 자격증명이나 session-id를 절대 노출하지 않음

---

## 4. 배포 / 온프레미스 구성 (Docker Compose 예시)
아래는 React 정적 빌드(Vite) + Go 서버, PocketBase, Caddy 조합의 docker-compose 예시입니다.

```yaml
# infra/docker-compose.yml
version: "3.8"

services:
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: transmission-shaded-webui
    env_file:
      - .env
    environment:
      - TRANSMISSION_HOST=http://transmission:9091
      - TRANSMISSION_USER=
      - TRANSMISSION_PASS=
      - COOKIE_SECRET=${COOKIE_SECRET}
      - CLIENT_ORIGIN=https://example.com
    ports:
      - "8080:8080"
    restart: unless-stopped
    volumes:
      - data:/pb_data
    networks:
      - web

  transmission:
    image: ghcr.io/linuxserver/transmission
    container_name: transmission
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Asia/Seoul
      - USER=${TRANSMISSION_USER}
      - PASS=${TRANSMISSION_PASS}
    volumes:
      - transmission_downloads:/downloads
    ports:
      - "9091:9091"
      - "51413:51413"
      - "51413:51413/udp"
    restart: unless-stopped
    networks:
      - web

  caddy: ## (optional) when needs https 
    image: caddy:2
    container_name: caddy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/caddy/Caddyfile:/etc/caddy/Caddyfile
      - ./web/dist:/srv
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - server
    restart: unless-stopped
    networks:
      - web

networks:
  web:

volumes:
  data:
  caddy_data:
  caddy_config:
  transmission_downloads:
```

샘플 .env (간단)
```bash
# .env (example)
VITE_API_BASE=https://example.com/api
TRANSMISSION_HOST=http://transmission.local:9091
TRANSMISSION_USER=
TRANSMISSION_PASS=
COOKIE_SECRET=change-me-to-a-secure-random-value
CLIENT_ORIGIN=https://example.com
```

도커 빌드 시나리오
1. web 정적 파일 빌드
2. server/pb_public 으로 이동
3. server 빌드

운영 팁
- pb_data는 반드시 볼륨으로 마운트 후 정기 백업
- React 앱은 프로덕션 빌드(Vite build) 후 정적 파일(dist)을 Caddy(혹은 Go 서버)로 서빙
- (선택) Caddy로 자동 TLS(퍼블릭 도메인) 또는 내부 CA 사용

---

## 5. 인증/보안 설계 요약 (React/Go 관점)
- PocketBase를 신원 공급자로 유지하되, Go 서버가 PocketBase 세션/토큰을 검증하여 API 접근을 허용
- 세션보관: HttpOnly Secure Cookie 권장
- CSRF 보호: 쿠키 기반 세션 사용 시 CSRF 토큰 사용 권장
- Transmission 자격증명 관리: 서버 env 또는 온프레 비밀 저장소 권장
- Rate limiting & IP 기반 방어: Go 서버에서 미들웨어/리버스 프록시(Caddy) 레벨로 적용

---

## 6. 개발 워크플로 & 로컬 실행
- 추천 구조: web (React/Vite), server (Go), services/pocketbase, packages/shared(옵션)
- 로컬 개발 순서:
  1. docker-compose up development (transmission)
  2. 터미널 A: go run . serve (Pocket Base API 서버)
  3. 터미널 B: cd web && npm run dev (Vite 개발 서버)
- 테스트: Go 서버는 net/http/httptest로 핸들러 단위 테스트, 클라이언트는 MSW로 통합 테스트

---

## 7. 확장성 및 향후 전환
- 현재는 Go 서버가 비즈니스 로직을 담당하나, 부하 증가 시 API와 이벤트(SSE/WebSocket) 처리를 별도 서비스로 분리하여 수평 확장 가능
- 높은 가용성/수평 확장 우선 시: Transmission 프록시를 별도 서비스로 떼어내고, 필요 시 PocketBase 외부에 Postgres 등의 백엔드를 도입해 마이그레이션 검토

---

## 8. Acceptance Criteria
- React(Vite) 앱 + Go 서버 조합이 Transmission RPC를 안전하게 프록시함
- PocketBase는 사용자 인증과 파일 저장을 담당함
- Docker Compose 예시로 온프레미스 배포가 가능함
- 미들웨어 로직(Transmission session-id 409 재시도)이 Go 서버에서 구현되어 있음

---

## 9. 다음 단계
1. React(Vite) 웹 템플릿/구조 확정 (web) — 라우팅/상태 관리 구성
2. Go 서버에 /api/transmission 프록시 핸들러 스켈레톤 추가 (409 재시도 포함)
3. PocketBase 컬렉션 JSON export 작성
4. infra/docker-compose 및 Caddyfile 보강, 배포 문서 업데이트