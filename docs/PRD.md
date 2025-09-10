# Product Requirements Document (PRD)
Transmission WebUI Shaded (Modern Frontend Layer for Transmission)

## 1. 개요
- 프로젝트명: Transmission WebUI Shaded
- 목적: 기존 Transmission Web UI를 대체하는 현대적이고 확장 가능한 프론트엔드 레이어 제공
- 형태: SPA + PWA, Docker 기반 간편 배포, 향후 플러그인 및 통합 생태계 확장

## 2. 비전 (Vision)
"다운로드 관리와 미디어 자동화를 위한 경량·모던·확장형 Transmission 프론트엔드 허브"

## 3. 성공 지표 (KPIs)
| 분류 | 1차 목표 | 측정 방법 |
|------|----------|-----------|
| 설치 편의 | docker-compose 단일 실행 | 문서 기반 설치 시간 (<5분) |
| 성능 | 주요 화면 LCP < 2.5s | Lighthouse 측정 |
| 실시간성 | Torrent 상태 업데이트 지연 < 2s | WebSocket/폴링 평균 |
| 유지보수성 | 주요 컴포넌트 커버리지 40%+ | 테스트 리포트 |
| PWA | install 가능 + offline shell | Lighthouse PWA 점수 > 90 |
| 사용자 확장 | 로그인 기능 도입 후 활성 사용자 2+ Roles | DB/로그 분석 |

## 4. 페르소나 (Personas)
1. 기본 사용자 (Downloader)
    - 목표: 토렌트 추가, 진행 상태 모니터링
    - 니즈: 빠른 추가, 직관 상태, 모바일 사용
2. 관리자 (Admin)
    - 목표: 모든 작업 관찰·제어
    - 니즈: 필터, 리소스 모니터링, 설정 접근
3. 파워유저 / 홈미디어 구축자
    - 목표: Sonarr/Radarr 등과 자동화
    - 니즈: 통합 플러그인, API 키 관리, 알림
4. 게스트(향후)
    - 목표: 제한적 다운로드 큐 조회
    - 니즈: 읽기 전용 뷰

## 5. 사용자 시나리오 (User Scenarios)
1. 설치
    - docker-compose up 실행 → Transmission + WebUI Shaded 자동 구동
2. 토렌트 추가
    - 마그넷 링크 입력 → 큐 반영 → 상태 컬러 태그로 실시간 변화
3. 다운로드 모니터링
    - 목록 정렬/필터 (상태, 속도, 태그)
4. 설정 변경
    - 전송 속도 제한, DHT, Encryption 등 Transmission 설정 UI 컨트롤
5. PWA 설치
    - 브라우저 "Install App" → 홈 화면 등록
6. 모바일 접근
    - 반응형 → Drawer 메뉴로 섹션 전환
7. (미래) 로그인 / 권한
    - Admin: 모든 항목 / User: 본인 추가 항목만
8. (미래) 플러그인 통합
    - Sonarr에서 에피소드 요청 → 자동 토렌트 추가 → 완료 알림

## 6. 범위 (Scope)
### 6.1 초기 릴리스 (MVP)
- Transmission 기본 기능:
    - 목록 조회 / 상태 표시 (Downloading, Seeding, Paused, Error, Completed)
    - 토렌트 추가 (마그넷 / 파일 .torrent 업로드)
    - 시작/정지/삭제/강제 재확인
    - 속도/순위/필터
- 설정(부분 집합): Global speed limits, Queue, Bandwidth, Network (기본)
- PWA 지원: manifest, service worker (offline shell + static assets)
- 반응형 UI (Desktop 탭, Mobile Drawer)
- 다크/라이트 모드
- 컬럼 커스터마이징 (간단 단계: 토글 On/Off)
- 국제화 구조 설계(문자열 key 기반, 기본 언어 ko → en 확장 가능)

### 6.2 제외 (Out of Scope for MVP)
- 인증/권한
- 고급 플러그인
- 알림 (Email/Push)
- 고급 검색 (Regex / Smart filtering)
- 다중 Transmission 인스턴스 관리

## 7. 사용자 스토리 (User Stories)
| ID | As a | I want | So that | 우선순위 |
|----|------|--------|---------|----------|
| US-01 | Downloader | 마그넷 링크 추가 | 다운로드 시작 | High |
| US-02 | Downloader | 진행률/속도 보기 | 상태 확인 | High |
| US-03 | Downloader | 다운로드 항목 정렬/필터 | 원하는 것만 보기 | Medium |
| US-04 | Downloader | 토렌트 일시중지/재개 | 제어 | High |
| US-05 | Downloader | 설정 일부 변경 | 속도 제한/네트워크 제어 | Medium |
| US-06 | Downloader | PWA 설치 | 앱처럼 사용 | Medium |
| US-07 | Admin | 전체 다운로드 보기 | 시스템 운영 | Future |
| US-08 | Admin | 사용자 권한 부여 | 보안 관리 | Future |
| US-09 | Power User | 플러그인 활성화 | 자동화 확장 | Future |
| US-10 | Power User | 알림 설정 | 완료 시 즉시 인지 | Future |

## 8. 기능 요구사항 (Functional Requirements)
| 코드 | 요구사항 | 상세 |
|------|----------|------|
| FR-01 | Torrent 목록 조회 | Pagination or virtual list, 상태 컬러 태그 |
| FR-02 | Torrent 추가 | Magnet, 파일 업로드, Drag&Drop |
| FR-03 | Torrent 제어 | Start/Stop/Pause/Force Verify/Remove(with confirm) |
| FR-04 | 속성 패널 | 선택 항목 상세 (Peers, Files, Trackers, Speed) |
| FR-05 | 설정 UI | 전송/네트워크/대역폭 일부 노출 |
| FR-06 | PWA | manifest.json, service worker, install prompt |
| FR-07 | 실시간 업데이트 | WebSocket → Fallback Polling |
| FR-08 | 다크모드 | 시스템 선호 + 수동 토글 |
| FR-09 | 반응형 | <768px Drawer 네비게이션 |
| FR-10 | 에러 처리 | 글로벌 Toast, 재시도 전략 |
| FR-11 | 국제화 기반 | i18n key 구조 (ko 기본) |

## 9. 비기능 요구사항 (NFR)
| 코드 | 항목 | 타겟 |
|------|------|------|
| NFR-01 | 성능 | LCP < 2.5s (일반 환경) |
| NFR-02 | 접근성 | Contrast WCAG AA, 키보드 포커스 링 |
| NFR-03 | 보안 | HTTPS, CSP 기본, 향후 JWT/OAuth 확장 |
| NFR-04 | 확장성 | 플러그인 API 추상 레이어 설계 (placeholder) |
| NFR-05 | 관측성 | 기본 콘솔 + 향후 로그 Hook 지점 |
| NFR-06 | 코드품질 | ESLint + TypeScript strict |
| NFR-07 | 배포 | 단일 Docker 이미지 (Nginx + Static) |
| NFR-08 | 신뢰성 | 재시도 지수백오프 (Transmission RPC 실패 시) |
| NFR-09 | 브라우저 호환 | Evergreen (Chrome/Edge/Firefox/Safari 최신) |

## 10. 경쟁/레퍼런스
| 제품 | 비고 |
|------|------|
| 기본 Transmission Web UI | 구형 디자인 |
| Flood | 모던 UI, Node 백엔드 |
| Qbit modern themes | 상태 컬러 참고 |
| Overseerr/Jellyseerr | 플러그인·요청 UX 참고 |

## 11. 리스크 & 완화
| 리스크 | 영향 | 완화 |
|--------|------|------|
| Transmission RPC 속도 | 느린 상태 반영 | WebSocket Proxy 도입 |
| 플러그인 범위 확장 복잡 | 아키텍처 부채 | 초기 명확한 인터페이스 정의 |
| PWA 캐시 invalidation | stale UI | 버전 해시 + SW skipWaiting 전략 |
| 설정 UI 범위 과다 | 개발 지연 | MVP 핵심 subset만 |

## 12. 초기 릴리스 체크리스트
- [ ] Torrent CRUD (추가/제어/삭제)
- [ ] 상태 실시간 반영
- [ ] 속도/진행률/ETA 표시
- [ ] 설정(필수 항목)
- [ ] PWA Install 가능
- [ ] 다크모드
- [ ] Docker-compose 문서
- [ ] 기본 테스트 (유틸 + 핵심 훅)

## 13. 로드맵 (High-level)
| 단계 | 기간(예시) | 목표 |
|------|-----------|------|
| Phase 1 | 주 1~3 | Skeleton + RPC 연동 + 목록 |
| Phase 2 | 주 4~5 | 제어 + 설정 + PWA |
| Phase 3 | 주 6 | 성능/접근성/문서 |
| Phase 4 | 미래 | 로그인/권한 |
| Phase 5 | 미래 | 플러그인(미디어 서비스) |
| Phase 6 | 미래 | 알림/통합 시나리오 |

## 14. 오픈 이슈 (초기)
- 플러그인 인터페이스 구체 정의 필요
- WebSocket vs Server-Sent Events 트레이드오프 분석
- Offline 모드에서 Torrent 상세 표시 범위

(끝)