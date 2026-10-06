# 로드맵: Coworkers → HR 서비스

> 갱신일: 2026-10-06 · 와이어프레임: https://claude.ai/artifact/PeoX24f7U5aopY7hLwUEih (비공개)
> 이전 기록: [backend-migration-plan.md](./backend-migration-plan.md) (Supabase 전환), [ADR-004](./decisions/ADR-004-supabase-backend.md), [ADR-005](./decisions/ADR-005-team-board.md), [ADR-006](./decisions/ADR-006-company-roles.md), [ADR-007](./decisions/ADR-007-attendance.md)

## 0. 방향 (인터뷰로 확정, 2026-10-06)

| 항목         | 내용                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 목적         | 두 사이드 프로젝트(Coworkers, HR-platform "다님")를 **프론트엔드 포트폴리오 하나**로 합친다                                 |
| 주인공       | **HR 서비스**. "근태 정책을 데이터로 다루는 HR 플랫폼"이고, 팀·할 일·협업은 그 안의 업무 공간                               |
| 구현 원칙    | **지금의 인증 구조, 코드, 레이아웃을 그대로 두고 근태 기능을 추가**한다. 새로 만들지 않는다                                 |
| 백엔드       | 지금 Supabase 구조 유지 (Auth + Postgres RLS + RPC). HR-platform의 Drizzle·Auth.js는 가져오지 않는다                        |
| 조직         | **회사 하나**(데모용 가상 회사) 안에 여러 팀                                                                                |
| 역할         | **인사담당자 / 팀장 / 직원** 3단계. 팀장도 팀원 휴가를 승인한다                                                             |
| 계정         | **인사담당자가 직원을 등록**한다. 공개 가입, 팀 초대 링크, 카카오 로그인은 없앤다. 면접관은 원클릭 데모 로그인으로 들어온다 |
| 출퇴근       | 버튼을 눌러 기록한다. 접속 상태(활동 중·자리 비움·오프라인)와는 별개                                                        |
| 가져오는 것  | HR-platform의 **정책 엔진**(자율·코어타임·고정, 순수 TypeScript 함수, 판정 결과는 저장하지 않고 매번 계산)                  |
| 하지 않는 것 | 정책 시뮬레이터, 연차 잔여일, 반차·시간 단위 휴가, 공휴일, 알림, 여러 회사 지원                                             |

### 와이어프레임에서 남은 결정 (추천안을 가정으로 적용, 확인 필요)

| 질문                                            | 가정                                             |
| ----------------------------------------------- | ------------------------------------------------ |
| 출퇴근 버튼 위치                                | 사이드바 맨 위 카드 + "내 근태" 페이지 둘 다     |
| 로그인 후 첫 화면                               | "내 근태" (지금은 첫 팀 페이지)                  |
| 정책 화면의 "저장하면 이렇게 바뀌어요" 미리보기 | **넣지 않음**. 시뮬레이터 범위라 나중 후보로     |
| 사이드바 팀 목록                                | 직원·팀장은 소속 팀만, 인사담당자는 전체         |
| 휴가 승인의 "같은 날 겹침" 표시                 | 넣음 (조회 한 번이면 되고 팀장 화면의 핵심 정보) |

## 1. 현재 상태 (출발점)

- 브랜치 `feat/supabase-backend`: main보다 커밋 33개 앞섬, 아직 푸시 안 함
- Supabase 마이그레이션 13개 적용, DB 테스트 8개 파일 통과
- 기존 API 함수 34개가 `NEXT_PUBLIC_BACKEND`로 분기함 (기존 API ↔ Supabase)
- 인증은 브라우저 QA 통과(카카오 제외). 나머지 도메인은 로그인 상태 QA 전
- 현재 활동 중, 팀 페이지 레이아웃, 팀 채팅 목업 완료. 팀 게시판은 DB만

## 2. 단계

각 단계는 하나의 PR로 묶을 수 있는 크기로 나눴습니다. 기간은 대략입니다.

### H0. 기반 정리 (1~2일)

근태 기능은 Supabase에만 만든다. 그래서 기존 API 분기를 먼저 정리해야 새 기능마다 두 모드를 신경 쓰지 않는다.

- [x] 로그인 상태 QA + 이미지 업로드: 57개 항목 통과, 버그 8건 수정 ([QA 결과](./qa/2026-10-06-supabase-qa.md))
- [x] QA 버그 수정
- [ ] PR 머지: [#3 Supabase 전환](https://github.com/SanginJeong/cwr/pull/3) → 기존 API 제거 PR (#3 위에 쌓음)
- [ ] QA 중 올린 Storage 이미지 25개 삭제 (대시보드 → Storage → images)
- [x] QA에서 나온 결정 3가지 반영 (2026-10-06): "목록 추가"로 문구 변경, 할 일 수정 시 설명 선택, 반복 설정 선택지가 잘리지 않게
  - 함께 고친 버그: 설명을 지우면 PDF 다운로드(react-pdf)가 페이지 에러를 냄
- [x] **기존 API 코드 제거** (브랜치 `feat/remove-legacy-api`): 분기 52개 파일 정리, axios·토큰 쿠키·`/api/auth/refresh`·`/login/kakao`·백엔드 스위치 삭제. 회귀 QA 59개 항목 통과
  - 함께 고친 버그: 게시글 이미지가 Supabase 주소라서 화면에 안 나오던 문제 (`isValidImageUrl`)
- [x] Supabase Realtime의 "Allow public access" 꺼져 있는지 확인 (꺼진 상태 기준으로 정책을 맞춤, 마이그레이션 `..._team_channel_broadcast`)
- [ ] ADR-004 Accepted (리뷰 필요)
- [ ] `.env`·Vercel에서 안 쓰게 된 값 정리: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_KAKAO_*`, `NEXT_PUBLIC_BACKEND`

### H1. 역할과 계정 (2~3일)

브랜치 `feat/h1-roles-accounts`. 마이그레이션 `20261006000005_company_roles`

- [x] **ADR-006** (Proposed, 리뷰 필요): 회사 하나 + 3단계 역할 + 인사담당자가 직원 등록
- [x] DB
  - `profiles`에 `company_role`(`HR_ADMIN` / `EMPLOYEE`), `is_active`(퇴사) 추가. **`policy_id`는 `policies` 테이블과 함께 H2로**
  - 팀장 = 기존 `memberships.role = 'ADMIN'`을 그대로 쓰고, 화면 문구만 "관리자" → "팀장"
  - 헬퍼 `is_hr_admin()`. 팀 생성·수정·삭제와 멤버 배정은 인사담당자 권한으로 변경. 인사담당자는 `is_member`로 모든 팀을 본다
  - 퇴사 처리된 직원은 `current_profile_id()`에서 막히고 팀 멤버 목록에서 빠진다 (기록은 보존). 근태 판정 제외는 H2
  - 초대 RPC·테이블 제거. 기록 보존을 위해 회원 탈퇴(`delete_account`)·팀 나가기(`leave_group`)도 제거
  - 새 계정은 비활성으로 시작 (공개 가입을 안 꺼도 아무것도 못 함)
- [x] 직원 등록 BFF `POST /api/admin/employees`, 퇴사 처리 BFF `PATCH /api/admin/employees/[userId]` (Auth ban). 화면은 H5
- [x] `supabase db push` → `npm run db:types` (손으로 맞춘 타입과 같음)
- [x] Supabase Auth의 "Allow new users to sign up" 끄기, Kakao provider 끄기
- [x] `.env`에 `SUPABASE_SERVICE_ROLE_KEY` 추가, 첫 인사담당자 SQL로 지정 ([supabase/README.md](../supabase/README.md) §5). Vercel 환경변수는 H6 배포 때
- [x] 화면에서 제거: 회원가입, 팀 참여(`/teams/join`), 팀 페이지의 초대 카드, 카카오 버튼, 회원 탈퇴
  - 팀 만들기(`/teams/new`)는 지우지 않고 **인사담당자 전용**으로 남김 (H5에 팀 생성 화면이 없어서, ADR-006)
  - 팀 수정·삭제, "팀에서 제외" 메뉴도 인사담당자에게만. 사이드바 팀 목록은 인사담당자에게 전체
- [x] 테스트: 역할별 권한 (직원·팀장·인사담당자·퇴사자) `supabase/tests/15_company_roles.test.sql`, 기존 테스트를 새 권한에 맞게 수정 (9/9 통과)
- [x] 브라우저 QA: 인사담당자·팀장·퇴사자 13개 항목 통과, 버그 3건 수정 ([QA 결과](./qa/2026-10-06-h1-roles-qa.md))

### H2. 근태 도메인 (3~4일)

브랜치 `feat/h2-attendance`. 마이그레이션 `20261006000006_attendance`. 결정 기록 [ADR-007](./decisions/ADR-007-attendance.md) (Proposed)

- [x] **정책 엔진 이식**: HR-platform `lib/policy-engine` → `src/entities/attendance/lib/policy-engine` (순수 함수 그대로, 현재 날짜는 인자로)
- [x] **Vitest 도입**(`npm test`)과 엔진 단위 테스트 37개 (기존 34 + 자정 근처 3) + 판정 헬퍼 5개
- [x] DB
  - `policies` (자율 / 코어타임 / 고정, 유형별 칸은 CHECK로 강제). 기본 정책 하나(`is_default`, 시드: 자율 출퇴근)
  - `profiles.policy_id` (H1에서 미룬 것. null이면 기본 정책)
  - `attendance_records` (직원·날짜당 하나, 출근·퇴근 시각)
  - `leave_requests` (대기 / 승인 / 반려, 결정한 사람·시각. 반려된 날짜는 다시 신청 가능)
- [x] RPC
  - `clock_in` / `clock_out`: **서버 시각**(KST) 기준. 하루에 한 번. 퇴근은 그날 기록에만 (야간 근무는 범위 밖)
  - `request_leave` / `cancel_leave`: **내일부터, 평일**, 하루 단위, 대기 중일 때만 취소
  - `decide_leave`: 신청자 팀의 팀장 또는 인사담당자, 본인 신청 제외. **먼저 처리한 결정이 적용**됨
  - `attendance_range(from, to, user?)`: 기록 + 승인된 휴가를 엔진 입력 형태로 + 적용 정책 + 서버 기준 `today`
  - 추가: `team_attendance_range`(팀장 화면용, 퇴사자 제외), `set_default_policy`, `set_employee_policy`
- [x] RLS: 본인 기록은 본인, 팀원 기록은 팀장, 전체는 인사담당자 (`can_view_attendance`)
- [x] 판정은 저장하지 않고 엔진으로 계산한다 (`entities/attendance`의 `evaluateAttendance`, `summarizeAttendance`)
- [x] DB 테스트 `70_attendance.test.sql` 62개 항목: 정책 제약, 출퇴근 규칙, 휴가 승인 권한, 결정 후 재결정 거부, 퇴사자 (10/10 파일 통과)
  - 동시 승인·반려는 PGlite가 연결 하나라 **순서대로만** 확인. 실제 동시성은 `where status = 'PENDING'` + 행 잠금 (ADR-007)
- [x] 프론트 연결부: `entities/attendance/api` (RPC 호출, 응답 타입). 화면은 H3~H5
- [ ] **(직접)** `supabase db push` → `npm run db:types` (지금 `database.types.ts`는 손으로 맞춰 둠)

### H3. 직원 화면 (3일)

- [ ] 사이드바 출퇴근 카드 (출근 전 / 근무 중 / 퇴근 완료)
- [ ] **공통 월 달력 컴포넌트** (`shared/ui/month-calendar`): 날짜 칸 안에 칩을 넣는 구조. 평일만 보기 옵션, 오늘·지난 날 표시, 칸 강조(테두리) 지원. H4의 팀 휴가 달력에서도 재사용
- [ ] "내 근태" 페이지 (`/attendance`): 월 달력, 이번 달 요약, 오늘 카드, 휴가 목록 (공통 달력 사용)
- [ ] 휴가 신청 모달과 신청 취소
- [ ] 로그인 후 첫 화면을 "내 근태"로
- [ ] 모바일: 사이드바 출퇴근 카드가 모바일 헤더에서 어떻게 보일지 정하고 구현

### H4. 팀장 화면 (2일)

- [ ] 팀 페이지: "오늘 우리 팀 근태" 카드, 멤버 목록에 근태 표시 (접속 상태 점은 유지)
- [ ] 휴가 승인 페이지: 대기 / 처리됨 탭, 같은 날 겹침 표시
- [ ] 이번 달 팀 휴가 달력: H3의 공통 달력을 **평일만** 모드로. 날짜 칸에 이름 칩(승인됨 보라, 대기 노란 점선), 2명 이상이면 주황 테두리와 "겹침 N명" (와이어프레임 "팀장 · 휴가 승인" 참고)
- [ ] 사이드바 "팀장" 메뉴와 대기 건수 배지

### H5. 인사담당자 화면 (3~4일)

- [ ] 구성원 관리 (`/admin/members`): 목록·검색·필터, 직원 추가(H1의 BFF), 정보 수정, 팀·역할·정책 배정, 퇴사 처리
- [ ] 근태 정책 (`/admin/policies`): 목록, 만들기·수정 (유형별 입력, 판정 규칙 문장)
- [ ] 휴가 승인 (`/admin/approvals`): 회사 전체 대기 목록 (H4 화면 재사용)
- [ ] 라우트 보호: middleware에서 역할 확인

### H6. 데모와 배포 (2~3일)

- [ ] 시드: 직원 30명, 팀 4개, 정책 3종, 최근 3개월 출퇴근 기록(지각·결근 패턴), 휴가(승인·반려·대기), 할 일 샘플
  - 다시 실행해도 같은 결과가 나오게 (idempotent)
- [ ] 로그인 화면의 원클릭 데모 로그인 3종 (인사담당자 / 팀장 / 직원)
- [ ] 데모 데이터 오염 대책: 매일 시드로 되돌리는 크론, 또는 데모 계정의 일부 쓰기 제한
- [ ] Vercel 배포: 환경변수, `vercel.json` 리전 `icn1`, Supabase Auth URL 설정
- [ ] 무료 플랜 일시정지(7일) 방지 크론 (위 시드 크론과 합칠 수 있음)
- [ ] `middleware.ts` → `proxy.ts` (Next 16)
- [ ] README를 HR 서비스 소개로 다시 쓰기: 정책 엔진 설계, RLS 권한 표, 데모 계정 안내

## 3. 나중에 (첫 완성본 이후)

| 항목                            | 상태           | 메모                                  |
| ------------------------------- | -------------- | ------------------------------------- |
| 팀 채팅                         | 목업 UI만      | 설계 항목은 아래. ADR-008로           |
| 팀 게시판 화면                  | DB만 (ADR-005) | 회사 공지로 바꿀지 다시 검토          |
| 정책 변경 미리보기 / 시뮬레이터 | 하지 않기로 함 | 엔진이 순수 함수라 나중에 붙이기 쉬움 |
| 주간 리포트                     | 보류           | LLM 없이 통계로 (완료율, 근태, 기여)  |
| 연차 잔여일, 반차, 공휴일, 알림 | 범위 밖        |                                       |
| 근태 → 접속 상태 자동 연동      | 하지 않기로 함 | 출퇴근은 버튼으로만                   |

### 팀 채팅 설계 항목

- 테이블 `team_chat_messages(id, group_id, writer_id, content, created_at)` + RLS(팀 멤버만)
- 전달 방식: Postgres Changes 구독 vs 저장 후 Broadcast. 팀 채널 `team:{groupId}`에는 이미 broadcast 권한이 있음
- 위로 스크롤하면 이전 메시지(커서), 읽음·안 읽은 수, 수정·삭제 범위, 퇴사한 사람의 메시지 처리
- 무료 플랜 Realtime 한도(동시 접속 200, 월 메시지 200만)

## 4. 이월된 확인 사항

| 항목                                                                       | 할 일                                                                                            |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 접속 상태: 브라우저 두 개, 10분 자동 자리 비움, 여러 탭, 재접속, 토큰 갱신 | H0 QA 때 함께                                                                                    |
| DB 테스트가 실제 Supabase가 아니라 PGlite + 흉내 환경에서만 돎             | H2 결정: PGlite 유지 (Docker 없이 수 초에 끝남). 동시성처럼 PGlite로 못 보는 것만 원격 QA로 확인 |
| 새 컴포넌트 Storybook 스토리 없음 (StatusDot, MemberPanel, TeamChatWidget) | H3~H5에서 새 UI와 함께                                                                           |
| 카카오 로그인                                                              | H1에서 제거함                                                                                    |

> **정정 기록**: Supabase 전환 Phase 3 때 "Supabase 모드로 띄워 확인했다"고 했지만, `.env` 끝에 줄바꿈이 없어서 실제로는 기존 API 모드였습니다. 결과는 두 모드에서 같아 틀리지 않았습니다. 2026-10-06 화면 확인은 Supabase 모드로 제대로 실행했습니다.

## 5. 기술 부채

- 원래 있던 lint 경고, `baseline-browser-mapping` 데이터 갱신
- 모바일에서 진행 상황 카드만 화면 끝까지 붙는 스타일(`-mx`)
- 사이드바 메뉴의 정렬이 섞여 있음 (상태 항목은 왼쪽, 나머지는 가운데)
- 개발 모드에서 Next.js 개발 표시(N)가 사이드바 프로필과 겹침
