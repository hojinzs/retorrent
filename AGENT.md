# Agent Guide & Commit Conventions

이 문서는 프로젝트 협업 에이전트(사람 또는 자동화 도구)와 기여자가 따라야 할 공통 작업 규칙, 브랜치/커밋 규칙, 품질 체크리스트를 정의합니다.  
프로젝트: Transmission WebUI Shaded (현대적인 Transmission 프론트엔드 계층)

작업 전, 반드시 `/docs` 의 문서 참고

---

## 1. 에이전트(Agent)의 역할

| 역할 | 설명 | 도구/자동화 |
|------|------|------------|
| 문서 동기화 | PRD/TRD/DESIGN_GUIDE 업데이트 검증 | 변경 diff 분석 |
| 코드 품질 | lint, type check, test 실행 | GitHub Actions |
| 커밋 규칙 검증 | Conventional Commits 형식 검사 | commitlint |
| PWA 무결성 | manifest / service worker 버전 증가 확인 | CI Hook |
| 종속성 점검 | 취약 패키지/중복 패키지 보고 | `npm audit`, `depcheck` |
| 번역 키 검증 | i18n 누락/미사용 키 리포트 | 스크립트 (추후) |
| 플러그인 확장 모니터링 (미래) | plugins/ 매니페스트 스키마 체크 | JSON Schema |

---

## 2. 브랜치 전략

단순화된 Trunk 기반 개발.

| 브랜치 | 용도 |
|--------|------|
| main | 배포/안정 |
| feature/* | 새로운 기능 (예: `feature/torrent-list-virtualization`) |
| fix/* | 버그 수정 |
| chore/* | 설정, 빌드 스크립트 등 |
| docs/* | 문서 전용 변경 |
| perf/* | 성능 관련 |
| refactor/* | 기능 변화 없는 구조 개선 |
| experiment/* | 실험 (병합 전 리뷰 필수) |

머지 방식:
- 기본: Squash & Merge (히스토리 간결화)
- 릴리즈 태그: `vMAJOR.MINOR.PATCH` (예: `v0.2.0`)

---

## 3. 커밋 규칙 (Conventional Commits 확장)

형식:
```
<type>(<scope>): <subject>
<BLANK LINE>
<body> (선택)
<BLANK LINE>
<footer> (선택)
```

### 3.1 type (허용 목록)

| type | 목적 | 예시 subject |
|------|------|--------------|
| feat | 사용자에게 보이는 새 기능 | feat(torrents): add row virtualization |
| fix | 버그 수정 | fix(rpc): handle 409 session renew |
| docs | 문서, 주석 | docs(readme): add docker section |
| style | 코드 포맷/세미콜론 등 (논리無) | style(ui): adjust button spacing |
| refactor | 기능 변경 없는 구조 개선 | refactor(store): split torrent hooks |
| perf | 성능 최적화 | perf(list): reduce re-renders |
| test | 테스트 추가/수정 | test(rpc): add retry logic test |
| build | 빌드 시스템, bundler, deps | build(ci): add cache step |
| ci | CI 파이프라인 | ci: add commitlint job |
| chore | 유지보수 (deps bump 포함) | chore(deps): update tanstack query |
| revert | 이전 커밋 되돌림 | revert: feat(auth): add login draft |
| ux | UI/UX 개선 | ux(progress): animate bar subtle |
| i18n | 다국어 키 추가/수정 | i18n(status): add queued key |
| security | 보안 관련 수정 | security: sanitize torrent name |
| deps | 종속성 추가/삭제/업 | deps: bump react 18.3.0 |

### 3.2 scope (권장)
`torrents`, `torrent-detail`, `rpc`, `settings`, `pwa`, `auth`, `plugins`, `ui`, `design`, `build`, `ci`, `deps`, `docs`, `i18n`, `store`, `list`, `config`.

### 3.3 subject 규칙
- 소문자 시작
- 끝에 마침표 금지
- 72자 이내 (권장)
- 한글/영문 혼용 허용 (일관되게)

예:
```
feat(pwa): add install prompt handling
fix(rpc): retry on 409 then cache new session id
```

### 3.4 body (선택)
무엇(WHAT)보다 왜(WHY) 중심, 전/후 비교, 수치.

### 3.5 footer
- 이슈/PR 연결: `Closes #12`
- BREAKING CHANGE 사용 예:
```
BREAKING CHANGE: torrent detail API 필드 progressPct → progress 로 변경
```

### 3.6 금지 예
`update file`, `wip`, `tmp commit`, `fix stuff`

---

## 4. 커밋 lint 설정 예

```js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat','fix','docs','style','refactor','perf','test','build','ci',
        'chore','revert','ux','i18n','security','deps'
      ]
    ],
    'scope-empty': [0],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100]
  }
}
```

Husky hook:
```
npx husky add .husky/commit-msg 'npx --no commitlint --edit "$1"'
```

---

## 5. PR 규칙

| 항목 | 규칙 |
|------|------|
| 제목 | 첫 커밋과 유사 (Squash 시 사용) |
| 라벨 | feat / fix / chore / docs / perf / refactor / test / ci / build |
| 설명 | 변경 요약, 스크린샷(UX), 성능 수치(옵션) |
| 체크리스트 | 테스트 통과, 타입 에러 없음, Lint OK |
| 리뷰어 | 최소 1명 |
| Draft | 실행 불완전 시 |
| 크기 | 400줄 초과 시 분할 권장 |

PR Template(제안):
```
## Summary
(변경 요약)

## Changes
- 목록

## Screenshots / Media (필요시)

## Checklist
- [ ] Lint/Type OK
- [ ] 테스트 (필요 시)
- [ ] 문서/주석 업데이트
- [ ] BREAKING CHANGE 여부 확인

Closes #
```

---

## 6. 코드 리뷰 체크리스트

| 카테고리 | 질문 |
|----------|------|
| 기능 | 요구사항 충족? |
| 성능 | 불필요 렌더? |
| 안정성 | 에러 처리? |
| 접근성 | 키보드/aria 적절? |
| 디자인 | shadcn 일관성? |
| 테스트 | 핵심 로직 커버? |
| 보안 | 입력 sanitize? |
| 구조 | 확장 용이? |
| PWA | 캐시/버전 영향? |

---

## 7. 자동화/CI (목표)

| 단계 | 작업 |
|------|------|
| install | cache + `npm ci` |
| lint | `npm run lint` |
| type check | `tsc --noEmit` |
| test | `npm run test -- --coverage` |
| build | `npm run build` |
| pwa check | manifest / SW 존재 |
| size guard(선택) | 번들 변화 리포트 |

Fail fast 적용.

---

## 8. (리포 구조 미정)
모노레포(Multi-package) 전환 가능성을 고려하여 디렉터리 구체 규칙은 확정하지 않음.  
결정 전까지:
- 패키지 구조 논의 시 Issue 생성
- 공통 코드 추출 필요 시 `packages/shared` 가안 문서화 후 진행
- 확정 시 이 섹션을 "디렉터리 규칙"으로 교체

---

## 9. 네이밍 규칙

| 대상 | 규칙 |
|------|------|
| 파일 | kebab-case.ts(x) |
| 컴포넌트 | PascalCase |
| 훅 | usePrefix |
| 타입 | PascalCase |
| 상수 | SCREAMING_SNAKE_CASE |
| env | `VITE_` prefix (클라이언트 노출) |

---

## 10. 테스트 가이드

| 유형 | 예시 |
|------|------|
| 유닛 | RPC 재시도 로직 |
| 컴포넌트 | 목록 렌더, 상태 뱃지 |
| 통합 | torrent 추가 → 목록 변화 |
| 모킹 | MSW (torrent-get/add) |

경로 예:
`/__tests__/rpc/transmission-rpc.test.ts`

---

## 11. 커밋 예시 (좋은 패턴)

```
feat(torrents): add virtualized torrent list

가상 스크롤 도입으로 1000건 렌더 시 FPS 22 → 55 개선.
추가: useVirtualList 훅.
```
```
fix(rpc): retry on 409 then persist new session id

Transmission 4.x 환경에서 세션 갱신 누락 이슈 해결.
Closes #12
```
```
refactor(store): split torrent and ui state

BREAKING CHANGE: useStore().torrents → useTorrentStore()
```

---

## 12. WIP 처리

- 미완성: Draft PR + `[WIP]` 접두어(선택)
- 로컬 임시 커밋: `wip:` → 머지 전 정리
- Draft 종료: 빌드/테스트 통과 후 리뷰 요청

---

## 13. 릴리즈 흐름 (초기 수동)

1. main 안정화
2. 태그 `git tag v0.x.0`
3. (미래) CHANGELOG 자동 생성 스크립트

---

## 14. 품질 게이트 (MVP 기준)

| 항목 | 기준 |
|------|------|
| Lint 오류 | 0 |
| Type 오류 | 0 |
| 핵심 테스트 | rpc, torrent list 필수 |
| 번들 빌드 | 성공 |
| PWA manifest | 존재 |
| Service Worker | 기본 캐싱 동작 |

---

## 15. 기여 절차 (Contribution Flow)

1. 이슈 생성/할당
2. 브랜치 생성 (feature/* 등)
3. 구현 & 커밋 (규칙 준수)
4. Draft PR (옵션)
5. CI Green
6. 리뷰 & 피드백 반영
7. Squash & Merge → 이슈 닫기

---

## 16. 자주 하는 실수 & 예방

| 실수 | 예방 |
|------|------|
| RPC 세션 409 반복 | 1회 재시도 후 오류 표출 |
| PWA 캐시 무효화 실패 | swVersion 상수 증가 |
| 번들 비대 | 컴포넌트 on-demand import |
| i18n 키 누락 | 빌드 시 추출 검사 (추후) |
| 리스트 렌더 느림 | virtualization + memo |

---

## 17. 향후 자동화 아이디어

| 아이디어 | 설명 |
|----------|------|
| CHANGELOG 자동 | conventional-changelog |
| i18n 키 검증 | extract + diff |
| 번들 사이즈 리포트 | `bundlesize` |
| Lighthouse CI | PWA 품질 추적 |
| Dependency bot | Renovate |

---

## 18. 에이전트 체크리스트 (PR마다)

- [ ] 커밋 메시지 규칙 충족
- [ ] 타입/린트/테스트 결과 또는 CI Green
- [ ] scope 과도/포괄 여부 검토
- [ ] 불필요 console 제거
- [ ] 관련 문서 업데이트 여부
- [ ] PWA 영향 시 swVersion bump 검토

---

## 19. FAQ

Q. 커밋 하나에 여러 type?  
A. 단일 type. 분리 권장.

Q. 문서 + 코드 같이?  
A. 가능. subject는 코드, body에 문서 언급.

Q. 한국어 커밋?  
A. 가능. 오픈 협업 대비 영문 권장. 혼용 일관성 유지.

---

## 20. 빠른 참조 (Cheat Sheet)

| 상황 | 커밋 예 |
|------|---------|
| 새 기능 | feat(settings): add global speed limit controls |
| 버그 수정 | fix(torrents): correct ETA display when paused |
| 의존성 업데이트 | deps: bump react 18.3.0 |
| 빌드 스크립트 | build: enable source map in production |
| 성능 개선 | perf(list): cache column width calc |
| 구조 리팩터 | refactor(rpc): extract retry handler |
| UX 개선 | ux(progress): smoother transition |
| 문서 | docs(prd): clarify plugin roadmap |
| 테스트 | test(rpc): cover session 409 retry path |

---

기여해주셔서 감사합니다!  
리포지토리 구조(모노레포 여부) 확정 후 본 문서 8번 섹션을 업데이트해주세요.