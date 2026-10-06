# ADR-005: 팀 게시판 데이터 모델과 권한

## Status

Proposed (초안. DB만 구현됨. 화면을 만들기 전에 리뷰)

## Date

2026-10-06

## Context

- 기존 자유게시판(`/board`, `articles`)은 전체 공개입니다. 팀 안에서만 보는 게시판이 필요합니다(migration-plan Phase 6).
- Supabase로 옮긴 뒤라 같은 DB 안에서 그룹·멤버십과 FK로 연결할 수 있습니다.
- 정해진 요구사항은 "팀 단위 게시판"뿐이라, 자유게시판의 구조(제목, 내용, 이미지, 댓글)를 기본으로 하고 팀 게시판에 필요한 것만 더합니다.

## Decision

### 1. 테이블

- `team_posts`: `group_id`, `writer_id`, `title`, `content`, `image`, `is_notice`, 시각
- `team_post_comments`: `post_id`, `writer_id`, `content`, 시각
- 조회용 뷰 `team_post_view`(작성자 닉네임·이미지, 댓글 수), `team_post_comment_view`
- 좋아요는 넣지 않습니다. 팀 안에서는 반응보다 내용 공유가 목적이고, 필요하면 나중에 `article_likes`와 같은 구조로 추가합니다.

### 2. 공지 고정

- `is_notice = true`인 글은 목록 맨 위에 고정합니다.
- **ADMIN만** 공지로 지정하거나 해제할 수 있습니다(`set_team_post_notice` RPC). 글 작성자라도 MEMBER는 바꿀 수 없습니다.

### 3. 권한 (RLS)

| 동작           | 권한                               |
| -------------- | ---------------------------------- |
| 글·댓글 조회   | 그룹 멤버                          |
| 글·댓글 작성   | 그룹 멤버 (작성자는 본인으로 고정) |
| 글·댓글 수정   | 작성자                             |
| 글·댓글 삭제   | 작성자 또는 **ADMIN** (팀 관리)    |
| 공지 지정·해제 | ADMIN                              |

자유게시판과 달리 ADMIN이 남의 글을 지울 수 있게 했습니다. 팀 공간은 관리자가 정리할 수 있어야 하기 때문입니다.

### 4. 작성자가 떠나거나 탈퇴할 때

- 팀을 나가도 글은 남습니다. 팀의 기록이기 때문입니다.
- **회원 탈퇴 시 팀 게시판의 글·댓글은 남기고 작성자만 비웁니다**(`on delete set null`). 화면에는 "탈퇴한 사용자"로 표시합니다.
  - 자유게시판(`articles`)은 탈퇴하면 글이 삭제됩니다(기존 API와 같음, behavior-spec §5). 팀 게시판은 팀의 자산이라 다르게 정했습니다.
- 팀을 삭제하면 글·댓글도 함께 삭제됩니다(cascade).

## Alternatives Considered

### 자유게시판(articles)에 group_id 컬럼을 추가해 같이 쓰기

- Pros: 테이블·화면 코드 재사용
- Cons: 전체 공개 글과 팀 글의 권한 규칙이 한 테이블에 섞여 RLS가 복잡해짐(group_id가 null이면 공개, 아니면 멤버만). 공지·ADMIN 삭제처럼 팀에만 있는 규칙도 분기해야 함
- Rejected

### 탈퇴 시 팀 글도 삭제 (자유게시판과 같게)

- Pros: 규칙이 하나
- Cons: 팀원 한 명이 탈퇴하면 팀의 회의록·공지가 사라짐
- Rejected

## Consequences

- 화면에서 작성자가 null인 글을 처리해야 합니다(작성자 없음 → "탈퇴한 사용자").
- 삭제 버튼은 작성자이거나 ADMIN일 때 보여줍니다. 수정 버튼은 작성자일 때만 보여줍니다.
- 테스트: `supabase/tests/50_team_board.test.sql`
