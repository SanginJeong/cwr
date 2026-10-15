# 에러 모니터링 (Sentry)

배포된 앱(cwr-one.vercel.app)에서 나는 에러를 사용자가 말하기 전에 알아채려고 Sentry 무료(Developer) 플랜을 붙였다.

## 무엇을 보내나

| 어디서                                   | 어떻게                                                           |
| ---------------------------------------- | ---------------------------------------------------------------- |
| 브라우저                                 | `src/instrumentation-client.ts` (잡히지 않은 에러, Promise 거부) |
| 서버 컴포넌트, Route Handler(BFF), proxy | `src/instrumentation.ts`의 `onRequestError`                      |
| 루트 레이아웃까지 깨지는 렌더링 에러     | `src/app/global-error.tsx`                                       |

- **에러만** 보낸다. 트레이싱 코드는 번들에서 빼고(`excludeTracing`), 세션 리플레이는 넣지 않았다.
- **개인정보를 싣지 않는다.** SDK v11 기본값은 사용자 정보, 쿠키, 헤더, 요청 본문을 전부 수집한다. HR 데이터라 `src/shared/config/sentry.ts`에서 사용자 정보, 쿠키(Supabase 인증 토큰), 본문은 끄고 헤더는 `user-agent`, `referer`만 남겼다.
- **Production에서만 켠다.** DSN을 Vercel Production 환경 변수에만 넣는다. 로컬과 preview는 DSN이 없어 아무것도 보내지 않는다.
- **릴리스**: Vercel 빌드에서 커밋 SHA(`VERCEL_GIT_COMMIT_SHA`)로 자동 태깅된다. `SENTRY_AUTH_TOKEN`이 있으면 소스맵도 올라가서 스택트레이스가 원본 TS 코드로 보인다.
- **광고 차단기 우회**: 브라우저 이벤트는 `/monitoring`(같은 도메인)으로 보낸 뒤 Sentry로 넘긴다. `src/proxy.ts` matcher에서 이 경로를 뺐다.
- 이벤트마다 `layer` 태그(`client` / `server` / `edge`)가 붙는다. 대시보드에서 나눠 보는 데 쓴다.

## 처음 연결하기

1. [sentry.io](https://sentry.io)에서 Next.js 프로젝트를 만든다. DSN, org slug, project slug를 적어 둔다.
2. Settings → Developer Settings → **Organization Tokens**에서 토큰을 만든다 (소스맵 업로드용).
3. Vercel → Settings → Environment Variables에 **Production만** 체크해서 넣는다.

   | 이름                     | 값                          |
   | ------------------------ | --------------------------- |
   | `NEXT_PUBLIC_SENTRY_DSN` | 프로젝트 DSN                |
   | `SENTRY_ORG`             | org slug                    |
   | `SENTRY_PROJECT`         | project slug                |
   | `SENTRY_AUTH_TOKEN`      | 2에서 만든 토큰 (Sensitive) |

4. 재배포한다. 빌드 로그에 소스맵 업로드 로그가 찍히면 된다.

## 연결 확인

- **서버 에러**: 처음 연결할 때는 인사담당자만 열 수 있는 `/api/admin/monitoring-check`(일부러 에러를 내는 Route Handler)로 확인하고 지웠다. 다시 확인하려면 이 경로를 잠깐 되살린다 (`git log --diff-filter=D -- src/app/api/admin/monitoring-check`). Sentry에 `layer:server` 이슈가 생기고 스택트레이스가 원본 `route.ts`를 가리키면 소스맵까지 된 것이다.
- **브라우저 에러**: 사이트에서 개발자 도구 콘솔에 아래를 입력한다. (`throw`만 바로 치면 콘솔 자체 에러라 전역 핸들러로 가지 않는다)

  ```js
  setTimeout(() => {
    throw new Error("Sentry 브라우저 에러 확인용");
  });
  ```

- **알림**: Alerts에서 기본 규칙("새 이슈가 생기면 이메일")이 켜져 있는지 본다. 위 두 이슈로 메일이 와야 한다.

## 대시보드

Dashboards → Create Dashboard → "Coworkers 에러 현황". 위젯은 모두 Dataset을 **Errors**로 둔다.

| 위젯               | 형태       | 설정                                                                  |
| ------------------ | ---------- | --------------------------------------------------------------------- |
| 일별 에러 수       | Line chart | Y: `count()`, 기간 14일                                               |
| 에러가 많은 경로   | Table      | 열: `transaction`, `count()`, `count_unique(issue)` / 정렬 `-count()` |
| 클라이언트 vs 서버 | Bar chart  | Y: `count()`, Group by: `layer`                                       |
| 릴리스별 에러      | Table      | 열: `release`, `count()` / 정렬 `-release`                            |

스크린샷은 `docs/images/monitoring-*.png`로 저장하고 README의 "에러 모니터링" 절에 넣는다.

## 무료 플랜 한도

에러 월 5,000건, 사용자 1명, 커스텀 대시보드 10개. 한도를 넘기면 그달 나머지 이벤트는 버려진다 (요금이 붙지는 않는다). 숫자는 바뀔 수 있으니 [sentry.io/pricing](https://sentry.io/pricing)에서 확인한다.
