# 크로스 브라우징 위험 요소 분석

2026-10-13. 브라우저마다 화면이 다르게 보이는 문제(폰트, 레이아웃)를 nightly 스크린샷 비교로 잡기 전에, 코드에서 위험한 곳을 찾아 테스트할 화면을 고른다.

- 대상 브라우저: Chromium, WebKit, Firefox(데스크톱 1440×900) + Mobile WebKit(iPhone 13, 화면 390×844 중 주소창을 뺀 보이는 영역 390×664)
- 범위 밖: 실제 기기(BrowserStack 등), Edge/구형 브라우저, Chromatic 확장, 발견한 깨짐을 고치는 작업(별도 작업으로)
- 한계: Playwright의 WebKit은 실제 Safari가 아니다(같은 엔진이지만 macOS/iOS 폰트·네이티브 컨트롤이 아니다). 그래서 "Safari 엔진에서 레이아웃이 깨지는가"까지만 보장한다

## 1. 폰트 (예전에 깨졌던 곳)

| 위치                     | 내용                                                                                                                                                       | 위험                                                                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/layout.tsx:13`  | `next/font/local`로 `PretendardVariable.woff2`를 불러와 `<html>`에 className으로 건다. fallback은 `Apple SD Gothic Neo`, `Malgun Gothic`, `sans-serif`     | **높음.** 폰트 파일을 못 불러오면 macOS/Windows 밖(리눅스 CI, 안드로이드 일부)에서는 `sans-serif`로 떨어지고, 한글 글리프가 없는 폰트면 □(tofu)로 나온다       |
| `tailwind.config.ts:83`  | `font-pretendard` 유틸리티가 `"Pretendard"`라는 이름을 쓴다. 하지만 next/font는 해시가 붙은 이름(`__pretendard_xxxx`)으로 등록하므로 이 이름의 폰트는 없다 | **잠복.** 지금은 아무 데서도 안 쓴다. 누가 `font-pretendard`를 붙이면 그 요소만 시스템 폰트로 바뀐다. 2026-02의 `cde8c50`(fallback 추가)이 이 계열 문제의 흔적 |
| `layout.tsx:15`          | `variable: "--font-pretendard"`를 만들지만 `<html>`에는 `className`만 걸어서 변수는 정의되지 않는다                                                        | 낮음. 사용처가 없다                                                                                                                                            |
| `TaskPdfDocument.tsx:16` | PDF는 `NotoSansKR`(ttf)로 따로 렌더링                                                                                                                      | 화면 비교 대상 아님                                                                                                                                            |

테스트에서 볼 것:

- 모든 스크린샷이 Pretendard로 찍혔는지. 폰트 로딩(`font-display: swap`) 전에 찍히면 fallback이 찍히므로, 찍기 전에 `document.fonts.ready`를 기다린다
- 5단계 검증: 폰트 경로를 일부러 깨뜨리면 4개 브라우저 모두에서 비교가 실패해야 한다

## 2. 레이아웃

| 위험                                                                  | 위치                                                                                                                                         | 브라우저 차이                                                                                                                          |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 뷰포트 높이 단위가 섞여 있다(`100vh`, `100dvh`, `100svh`, `h-screen`) | `PageLayout.tsx:30`, `CenteredCardLayout.tsx:38`, `LandingPage.tsx:14`, `not-found.tsx:8`, `ResetPasswordPage.tsx:7`, `SidebarTablet.tsx:36` | **높음(Mobile WebKit).** iOS Safari에서는 `100vh`가 주소창을 포함한 높이라 아래가 잘리거나 스크롤이 생긴다. `dvh`/`svh`는 Safari 15.4+ |
| `sticky` + 높이 `100vh` 사이드바                                      | `SidebarTablet.tsx:36`, `SidebarMobile.tsx:25`, `BoardPage.tsx:20`                                                                           | 중간. 부모에 `overflow`가 있으면 WebKit에서 sticky가 풀린다                                                                            |
| `backdrop-blur`                                                       | `MODAL_STYLE.ts:3`, `OverlayLoading.tsx:5`, `OnboardingModal.tsx:65`                                                                         | 중간. Firefox 103+만 지원하고 렌더링 결과가 브라우저마다 다르다(픽셀 비교 시 노이즈)                                                   |
| `line-clamp`                                                          | `FeedArticleItem.tsx:20`, `ArticleTitle.tsx`, `BestArticleRankItem.tsx`                                                                      | 낮음. 모두 지원하지만 한글 `break-all`과 함께 줄 끝 처리가 엔진마다 다르다                                                             |
| 스크롤바 숨김                                                         | `globals.css`의 `.hide-scrollbar`                                                                                                            | 낮음. `scrollbar-width`와 `::-webkit-scrollbar`를 둘 다 써서 대응돼 있다                                                               |

## 3. 폼 컨트롤 (네이티브 UI라 엔진마다 모양이 가장 다르다)

| 위험                                      | 위치                                                                                    | 브라우저 차이                                                                               |
| ----------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `<input type="time">`                     | `PolicyEditor.tsx:133,142,155`                                                          | **높음.** Chromium/WebKit/Firefox가 모두 다른 모양으로 그리고, 너비도 다르다                |
| `<input type="date">`                     | `EditEmployeeModal.tsx:70`                                                              | **높음.** 위와 같다. 데스크톱 WebKit에서는 안쪽 세그먼트 모양이 다르다                      |
| 기본 `<select>`(`appearance` 초기화 없음) | `EditEmployeeModal.tsx`, `RegisterEmployeeModal.tsx`, `TeamLeaveCalendarSection.tsx:47` | 중간. 화살표 모양과 안쪽 여백이 다르다. `h-11`은 지켜지지만 글자 세로 위치가 어긋날 수 있다 |
| `appearance-none` 체크박스                | `Todo.tsx:48`                                                                           | 낮음                                                                                        |

네이티브 컨트롤은 엔진마다 다른 게 정상이다. 그래서 기준 이미지는 **브라우저별로 따로** 둔다(Playwright 기본 동작: `{이름}-{프로젝트}-{플랫폼}.png`). "Chromium과 똑같아야 한다"가 아니라 "그 브라우저의 지난 모습과 같아야 한다"를 본다.

## 4. 스크립트·API

| 위험                                                                          | 위치                                                                                   | 판단                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `new Date(string)` 파싱                                                       | `formatTime.ts:32`, `formatDate.ts:19`, `getTaskStatus.ts:9`, `TaskListPage.tsx:44` 등 | 낮음. 대부분 ISO(`YYYY-MM-DDTHH:mm:ssZ`)이거나 `T00:00:00Z`를 붙여서 쓴다. `"YYYY-MM-DD HH:mm"`처럼 공백이 들어간 형식은 없다. `TaskListPage.tsx:44`의 `?date=` 값은 URL에서 오므로 형식이 보장되지 않는다(기능 문제, 이번 범위 밖) |
| `navigator.clipboard.writeText`                                               | `RegisterEmployeeModal.tsx:72`                                                         | 낮음. HTTPS/localhost에서는 모두 지원. 화면에는 영향 없다                                                                                                                                                                           |
| 최신 JS API(`requestIdleCallback`, `structuredClone`, `.at()`, `toSorted` 등) | 없음                                                                                   | —                                                                                                                                                                                                                                   |
| GSAP / framer-motion 애니메이션                                               | 랜딩(`widgets/landing`), 사이드바, 온보딩 모달, `DatePicker`                           | 중간(테스트 안정성). `toHaveScreenshot`의 `animations: "disabled"`는 CSS 애니메이션만 멈춘다. JS 애니메이션은 끝날 때까지 기다리거나 대상에서 뺀다                                                                                  |

## 5. 스크린샷을 불안정하게 만드는 것

- **seed가 실행한 날 기준이다.** `e2e/seed/generate.ts`는 `today` 기준으로 근태·휴가를 만든다. 서버(Next)가 실제 시각으로 그리므로 `page.clock`만으로는 날짜를 고정할 수 없다. 날짜·시각·상대 시간 텍스트는 `mask`로 가리고, 레이아웃(줄 수·높이)이 날짜에 따라 바뀌는 영역은 해당 요소만 찍는다
- **실시간 표시.** `PresenceProvider`(접속 중 표시), 토스트, 로딩 스켈레톤(`aria-busy`). 기존 `waitForContent`로 스켈레톤이 없어질 때까지 기다린다
- **OS 폰트 렌더링 차이.** 기준 이미지는 CI(ubuntu)에서만 만든다(기존 `update_snapshots` 입력 사용). 로컬 macOS에서 찍은 이미지는 커밋하지 않는다

## 6. 테스트할 화면

위험 요소가 실제로 그려지는 화면 위주로 고른다. 기존 a11y 스펙과 같은 역할·경로를 써서 seed와 로그인 상태(`e2e/.auth/{role}.json`)를 그대로 쓴다.

| #   | 화면                                   | 역할     | 이유                                                     |
| --- | -------------------------------------- | -------- | -------------------------------------------------------- |
| 1   | `/login` (기존)                        | —        | 폰트, `CenteredCardLayout`의 `100vh`/`svh`               |
| 2   | 404 (기존)                             | —        | `100dvh`                                                 |
| 3   | `/attendance` 내 근태                  | employee | 로그인 후 첫 화면. `PageLayout` `100vh`, 사이드바 sticky |
| 4   | `/approvals` 휴가 승인                 | leader   | 팀 휴가 캘린더 + 기본 `<select>`                         |
| 5   | `/admin/members` 구성원 관리           | hr       | 표 레이아웃, 긴 한글                                     |
| 6   | 구성원 정보 수정 모달                  | hr       | `type="date"`, `<select>` 여러 개, `backdrop-blur`       |
| 7   | `/admin/policies` 근태 정책            | hr       | `type="time"` 3개                                        |
| 8   | `/board` 게시판                        | employee | `line-clamp`, `aspect-video`, pc `sticky` 사이드         |
| 9   | 모바일 사이드바 열림 (Mobile WebKit만) | employee | `fixed inset`, `max-w-[85vw]`, 모바일 헤더 sticky        |

뺀 것:

- 랜딩(`/`): GSAP 스크롤 애니메이션이라 매번 다르게 찍힌다(ADR-003). 필요하면 나중에 히어로 영역만 찍는다
- 팀·할 일(`/teams/...`): 데이터가 많이 바뀌고, 위 화면과 위험 요소가 겹친다
- 온보딩 모달: framer-motion 애니메이션, `backdrop-blur`는 6번에서 본다

### 구현하면서 정한 것 (3단계, `e2e/visual/visual.spec.ts`)

- **뷰포트만 찍는다(`fullPage` 아님).** 달력 주 수나 목록 길이에 따라 페이지 높이가 바뀌어도 이미지 크기가 같다
- **날마다 바뀌는 곳은 가린다(mask).** 근태 달력·요약·오늘 카드·휴가 목록, 승인 대기 목록과 팀 달력, 구성원 표의 "이번 달"·"오늘" 칸. 그중 높이가 바뀌는 영역은 높이를 고정한다(`fixHeight`). 그래서 이 영역들의 **안쪽** 렌더링은 비교하지 않고, 틀·폰트·사이드바·폼 컨트롤·뷰포트 높이 문제만 본다
- **모달·서랍은 요소만 찍는다.** 뒤 화면이 날마다 달라서다. 그래서 `backdrop-blur`는 비교 대상에서 빠진다
- **입사일 `date` 입력은 화면 값만 고정한다**(`2024-03-04`, 저장하지 않음). 시드 입사일이 오늘 기준이라서다
- **게시판은 빈 상태다.** 시드에 글이 없어서 `line-clamp`, `aspect-video`는 보지 못한다. 글을 시드에 넣는 건 나중 과제
- **웹폰트 로딩을 따로 단언한다.** 찍기 전에 `document.fonts`에 Pretendard가 `loaded`인지 확인한다. 폰트가 깨지면 픽셀 차이 대신 "Pretendard 웹폰트가 불러와지지 않았다"로 실패해 원인이 바로 보인다
- 시작할 때 시드를 다시 만든다. 다른 스펙이 바꾼 데이터(출근, 정책, 팀)가 화면에 나오지 않게 하기 위해서다
- 기존 V2(로그인, 404)는 `a11y.spec.ts`에서 옮겼고, 예전 기준 이미지(전체 페이지)는 지웠다. 첫 CI 실행에서 4개 브라우저 기준 이미지를 새로 만든다

## 7. 다음 단계에 넘기는 결정

- 2단계: `playwright.config.ts`에 `webkit`, `firefox`, `mobile-webkit` 프로젝트를 추가한다. 기존 기능 스펙은 Chromium에서만 돌리고, 스크린샷 스펙만 4개 브라우저에서 돈다(nightly 시간 관리)
- 3단계: 스크린샷 스펙을 `e2e/visual/`로 분리한다. 공통 헬퍼: 폰트 대기(`document.fonts.ready`), 날짜/시각 `mask`, `animations: "disabled"`
- 4단계: CI에서 `npx playwright install --with-deps chromium webkit firefox`
- 5단계: `layout.tsx`의 폰트 경로를 일부러 바꿔 4개 브라우저 모두 실패하는지 확인한다(커밋하지 않는다)
- 정리 후보(이번 범위 밖): 사용하지 않는 `font-pretendard` 유틸리티와 `--font-pretendard` 변수를 정리하거나 서로 연결하기

## 8. 첫 실행에서 찾은 것 (2026-10-13)

기준 이미지 33장을 CI에서 만들면서 브라우저 차이를 확인했다.

| 화면                    | Chromium · WebKit                                   | Firefox                               |
| ----------------------- | --------------------------------------------------- | ------------------------------------- |
| 근태 정책 `type="time"` | `오전 10:00` / `오후 04:00`                         | `10:00 AM` / `04:00 PM` + 시계 아이콘 |
| 정보 수정 `type="date"` | `2024. 03. 04.`                                     | `03 / 04 / 2024` + 달력 아이콘        |
| 기본 `<select>`         | WebKit은 회색 그라데이션 버튼 모양, 화살표가 다르다 | 화살표가 얇은 꺾쇠                    |

- **Firefox는 페이지 언어(`lang="ko"`)나 브라우저 locale(`ko-KR`)이 아니라 Firefox 자체 언어(CI는 영어판)로 날짜·시각 입력을 그린 것으로 보인다.** 영어판 Firefox를 쓰는 한국어 사용자에게는 정책 화면의 시각이 `AM/PM`, 입사일이 `월/일/연도` 순서로 보인다. 깨짐은 아니지만 날짜 순서가 다르게 읽힐 수 있다. 고칠지는 별도 판단(예: 직접 만든 시각 선택기, 또는 입력 옆에 형식 안내)
- 폰트는 4개 브라우저 모두 Pretendard로 그려졌다
- main nightly(2026-10-12) 실패 원인: 예전 로그인 기준 이미지(전체 페이지)가 지금 화면과 530픽셀 달랐다. 이 기준 이미지를 새로 만들면서 함께 해결된다

## 9. 폰트 깨짐 검증 (5단계, 2026-10-13)

임시 브랜치에서 `<html>`의 `pretendard.className`을 빼서 예전 폰트 깨짐(시스템 대체 폰트로 그려짐)을 재현하고 CI를 돌렸다. 브랜치는 확인 후 지웠다.

| 실행                                                                                         | 결과                                                                                                               |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [폰트 깨짐 (serial)](https://github.com/SanginJeong/cwr/actions/runs/38350650895)            | 4개 브라우저 모두 첫 화면(로그인)에서 실패. 하지만 serial이라 나머지 32개가 돌지 않았다 → serial 제거              |
| [폰트 깨짐 (serial 제거 후)](https://github.com/SanginJeong/cwr/actions/runs/38351338863)    | **스크린샷 33개 모두 실패**, 기능 스펙 51개는 통과. 기능 테스트만으로는 폰트 깨짐을 못 잡는다는 게 그대로 드러난다 |
| [정상 (같은 커밋, 폰트 그대로)](https://github.com/SanginJeong/cwr/actions/runs/38351341712) | 84개 통과, 33장 일치                                                                                               |

- Chromium·Firefox는 웹폰트 단언에서 "Pretendard 웹폰트가 불러와지지 않았다"로 실패했다
- WebKit·Mobile WebKit은 웹폰트 단언을 통과했다(쓰이지 않는 `@font-face`도 `loaded`로 보고). 대신 스크린샷 비교에서 실패했다. 단언과 픽셀 비교를 겹쳐 둔 덕분에 4개 브라우저 모두 잡혔다
