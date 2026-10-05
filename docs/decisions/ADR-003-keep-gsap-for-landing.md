# ADR-003: 랜딩 애니메이션은 gsap 유지 (framer-motion과 병행)

## Status

Accepted

## Date

2026-10-05

## Context

애니메이션 라이브러리가 두 개입니다.

- `gsap` + `@gsap/react`: 랜딩(`/`) 섹션 5개에서만 사용. timeline, stagger, ScrollTrigger를 약 30곳에서 호출
- `framer-motion`: Sidebar(전 페이지), 온보딩 모달, 게시판 피드

## Decision

당분간 둘 다 유지합니다. 새로 만드는 애니메이션은 framer-motion으로 작성합니다.

## Alternatives Considered

### 랜딩을 framer-motion으로 재작성하고 gsap 제거

- Pros: 의존성 2개 감소, 애니메이션 API 하나로 통일
- Cons: Next는 라우트별로 코드를 분할하므로 gsap은 이미 랜딩 번들에만 들어감. 제거해도 다른 페이지 성능은 달라지지 않음. 대신 timeline·ScrollTrigger 연출을 다시 맞추느라 시각 QA 비용이 듦
- Rejected (보류): 랜딩을 리디자인할 때 함께 진행

## Consequences

- 랜딩 외 페이지에 gsap을 새로 들이지 않음 (리뷰에서 확인)
- 랜딩을 리디자인할 때 이 ADR을 Superseded로 바꾸고 gsap 제거
