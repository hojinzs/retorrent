# Design Guide
Transmission WebUI Shaded

## 1. 디자인 원칙
1. 명확성 (Clarity): 정보 우선, 과도한 장식 최소화
2. 밀도 제어 (Adaptive Density): 많은 Torrent 목록도 가독성 유지
3. 상태 시각화 (Status Visibility): 색상/아이콘/텍스트 3중 표기
4. 확장성 (Scalable Navigation): 탭 증가 시 overflow 전략
5. 접근성 (A11y): 컬러 대비, 포커스 가능, Semantics

## 2. 레이아웃
Desktop:
┌────────────────────────────────────────────┐
│ Top Nav Tabs (Scrollable / Overflow → chevron) │
├────────────────────────────────────────────┤
│ (Optional) Secondary toolbar (filters)     │
├────────────────────────────────────────────┤
│ Main Content (List / Detail)               │
└────────────────────────────────────────────┘

Mobile:
- Top minimal bar (Logo + Action + Hamburger)
- Drawer Navigation: Torrents / Add / Settings / (future) Plugins
- FAB (+) for 빠른 추가 (선택)

Breakpoints (Tailwind):
- sm: 640px
- md: 768px (Drawer → 탭 전환 기준)
- lg: 1024px

## 3. 네비게이션 패턴
- 탭 (Primary sections)
- Overflow: 탭 많아질 경우 스크롤 + gradient fade
- Drawer (Mobile): 순서 = Dashboard > Torrents > Add > Settings > (future: Plugins)

## 4. 컬러 시스템
Base (light):
- Background: #FFFFFF
- Surface: #F8F9FA
- Border: #E2E8F0
- Text Primary: #111827
- Text Secondary: #4B5563
- Accent: #6366F1 (Indigo 500)
- Accent Hover: #4F46E5
- Danger: #DC2626
- Warn: #D97706
- Success: #059669
- Info: #0EA5E9

Dark:
- Background: #0B0D11
- Surface: #11141A
- Border: #1F242C
- Text Primary: #F1F5F9
- Text Secondary: #94A3B8
- Accent: #818CF8
- Accent Hover: #6366F1
- Danger: #F87171
- Warn: #FBBF24
- Success: #34D399
- Info: #38BDF8

Status Tag Colors:
| Status | Color Light | Color Dark | Icon |
|--------|-------------|-----------|------|
| Downloading | Indigo 500 bg/indigo 50 text-dark | Indigo 400 | ArrowDown |
| Seeding | Emerald 500 | Emerald 400 | Upload |
| Paused | Slate 400 | Slate 500 | Pause |
| Error | Red 500 | Red 400 | AlertTriangle |
| Checking | Amber 500 | Amber 400 | RefreshCw |
| Completed | Emerald 600 subtle | Emerald 500 subtle | CheckCircle2 |
| Queued | Blue 400 | Blue 300 | Clock |

## 5. 타이포그래피
- Font: Inter (시스템 폴백)
- Scale:
    - H1: 24px / 600
    - H2: 20px / 600
    - H3: 18px / 600
    - Body: 14-15px / 400
    - Caption: 12px / 400
- Line-height: 1.4–1.5
- 토렌트 목록: 14px, 조밀하지만 여백 8px 유지

## 6. 간격/그리드 (Spacing)
Unit: 4px scale
- Section padding: 24px
- Card padding: 16px
- List row vertical: 6–8px
- Drawer padding: 16px

## 7. 컴포넌트 가이드
Buttons:
- Variants: primary / outline / subtle / ghost / destructive
- Height: 36px (default), 28px (dense), 44px (mobile large)
- Icon-only: 36px square, tooltip 제공

Badges:
- Status badge: filled (vivid) or subtle (completed)
- Shape: pill (border-radius: 9999px)
- Font: 12px / medium

Tables / Virtual List:
- Hover row highlight (#F1F5F9 light / #1E293B dark subtle)
- Selected row accent border-left 2px

Drawer:
- Focus trap
- Close gesture (ESC / overlay click)
- Depth shadow: sm → lg (모바일 오버레이)

Dialogs:
- Add Torrent: Large form (drag&drop zone)
- Confirm destructive: Red accent top bar or icon

## 8. 아이콘 스타일
- Lucide
- Stroke width: 1.5
- 색상은 currentColor 사용, 상태에 따라 text-[color] 클래스 적용

## 9. 상태 & 피드백
- Loading: Skeleton (list rows 6개)
- Empty: Icon + '토렌트가 없습니다' + CTA(Add)
- Error: Inline Alert + Retry button
- Progress: linear bar (determinate), stripe 애니메이션 지양 (과도함)

## 10. 접근성
- 포커스: outline 2px accent ring (offset 2)
- Color contrast: 최소 4.5:1
- Icon-only 버튼 aria-label 필수
- Status badge: aria-label="다운로드 중 (45%)" 예시

## 11. 다크모드
- prefers-color-scheme 우선 적용 → 사용자 토글 저장(localStorage)
- 전환 애니메이션 최소화 (opacity + color-transition 150ms)

## 12. 애니메이션
- 전역: ease-out, 150ms
- Drawer: translateX
- Toast: slide + fade
- Skeleton: pulse (prefers-reduced-motion 시 비활성)

## 13. 목록 정보 구조 (Torrent Row)
| 구역 | 내용 |
|------|------|
| Left | 체크박스(미래 bulk), 상태 아이콘 |
| Main | 이름 (한 줄 ellipsis) + 진행률 bar (아래) |
| Meta | 속도 ↓/↑, 완료 %, ETA, 크기 |
| Right | Context Menu (⋯) |

Context Menu 항목 (MVP):
- 시작 / 일시중지
- 강제 재확인
- 삭제 (확인 모달)
- 상세 보기

## 14. 색상 활용 규칙
- 빨강(Danger)는 파괴적 작업에 한정 (삭제)
- 노랑(Warn)은 점검/확인 중 (Checking)
- 초록(Success/Seeding)은 성공/활성 공유

## 15. 아이콘 맵핑
| 기능 | 아이콘 |
|------|--------|
| Add Torrent | Plus |
| 시작 | Play |
| 일시중지 | Pause |
| 제거 | Trash2 |
| 강제 재확인 | RotateCcw |
| 설정 | Settings |
| 검색 | Search |
| 메뉴 | MoreHorizontal |
| 설치(PWA) | Download |
| 로그인(미래) | User |

## 16. 반응형 구체
| 폭 | 변형 |
|----|------|
| <480px | Torrent Row 단일 컬럼 (이름 + 2줄 메타) |
| 480–768 | 2열 메타 (속도, 퍼센트, ETA) |
| >768 | 풀 테이블 레이아웃 |

## 17. 다국어 (i18n)
Key 네이밍:
- actions.addTorrent
- status.downloading
- ui.empty.noTorrents
- errors.rpc.session
  문자열 길이 변화 고려 → 버튼 최소 폭 고정하지 않음

## 18. 샘플 컴포넌트 (Status Badge)
```tsx
interface StatusBadgeProps { status: TorrentStatus; progress?: number; }
const STATUS_MAP = {
  downloading: { color: 'bg-indigo-500 text-white', icon: ArrowDown },
  seeding: { color: 'bg-emerald-600 text-white', icon: Upload },
  paused: { color: 'bg-slate-400 text-slate-900', icon: Pause },
  error: { color: 'bg-red-600 text-white', icon: AlertTriangle },
  checking: { color: 'bg-amber-500 text-white', icon: RefreshCw },
  completed: { color: 'bg-emerald-700 text-white', icon: CheckCircle2 },
  queued: { color: 'bg-blue-500 text-white', icon: Clock }
}
```

## 19. 아이콘 + 텍스트 배치 규칙
- Left icon 16px
- gap-1.5
- line-height: 1 for 배지

## 20. 플러그인 UI 슬롯 (미래)
- Torrent 상세 탭 추가
- 상단 네비게이션 새 탭
- 메인 대시보드 카드 추가 (grid area append)
- Context menu actions 확장

## 21. 토스트 스타일
- 위치: top-right (mobile: bottom-center)
- Variant: info / success / error
- Duration: 4s (error 6s)
- Animations: slide in, fade out

## 22. 아이콘 통한 상태 식별 (색각 보조)
- 색상 + 형태 (아이콘)
- 에러 = 삼각형, 진행 = 화살표, 완료 = 체크

## 23. 문서 & 컴포넌트 카탈로그
Story-like 페이지 (dev only):
- /design/typography
- /design/colors
- /design/components (Badge, Button, Dialog)

## 24. 피드백 루프
- 초기 사용자(관리자) 1명 인터랙션 기록(스크린샷) → 개선 반복
- 목록 밀도 옵션 (기본 Normal, Compact 후속)

## 25. 예시 스크린 흐름 (텍스트)
1. Dashboard: Active Download 5 / Completed 12 카드
2. Torrents: virtual table, 상단 필터(상태 드롭다운)
3. Add Torrent: magnet 입력 + optional category(label)
4. Detail: 4 탭 (Files / Peers / Trackers / Info)

(끝)