> 팀 프로젝트(Coworkers 협업 툴) 시절의 README입니다. 지금 서비스 소개는 [README](../README.md)에 있습니다.

# Coworkers

팀단위 업무 배정 및 현황 공유 서비스

## 프로젝트 선정 이유

기존 협업 과정에서는 **메신저, Notion, Github, Figma 등 여러 서비스가 기능별로 분산되어 있어** 앱을 계속 이동하면서 작업 해야하는 번거롭다는 불편함이 있었습니다.
이러한 불편함을 해소하기 위해서 필요한 핵심 기능들만 모아놓은 업무 관리 서비스를 만들어보면 좋을 것 같아서 주어진 주제들 중 Coworkers를 선택하게 되었습니다.

## 맡은 역할

### 재사용성 있는 공통컴포넌트 개발

- [Button](https://github.com/SanginJeong/Coworkers/tree/develop/src/common/Button)
- [Dropdown](https://github.com/SanginJeong/Coworkers/tree/develop/src/common/Dropdown)
- [Icon](https://github.com/SanginJeong/Coworkers/tree/develop/src/common/Icon)
- [Modal](https://github.com/SanginJeong/Coworkers/tree/develop/src/common/Modal)
- [ProgressBadge](https://github.com/SanginJeong/Coworkers/tree/develop/src/common/ProgressBadge)
- [ProgressBar](https://github.com/SanginJeong/Coworkers/tree/develop/src/common/ProgressBar)
- [Select](https://github.com/SanginJeong/Coworkers/tree/develop/src/common/Select)

### 페이지 개발

- [자유게시판(게시글 목록)](https://github.com/SanginJeong/Coworkers/tree/develop/src/app/dashboard)
- [자유게시판](<https://github.com/SanginJeong/Coworkers/tree/develop/src/app/(route)/dashboard>)
- [팀페이지, 팀 상세페이지](<https://github.com/SanginJeong/Coworkers/tree/develop/src/app/(route)/team>)

## 개선 경험

### 권한 기반 접근 제어 및 UI 개선

기존에는 페이지 컴포넌트 내에서 권한 검사 후 redirect 시키는 로직에서는 이 때 해당 url 페이지에서 검사를 하기 때문에 화면 깜빡임 문제가 있었습니다.
**Next.js Middleware를 활용하여 인증/권한 검사를 선처리**하도록 구조를 개선했습니다. [middleware.ts](https://github.com/SanginJeong/Coworkers/blob/develop/src/middleware.ts)

```jsx
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value;

  const { pathname } = req.nextUrl;

  const authRoutes = ["/login", "/signup", "/reset-password"];

  if (token && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const protectedRoutes = ["/my-page", "/my-history", "/team", "/team-creation", "/team-join", "/dashboard"];

  if (!token && protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!token && req.nextUrl.pathname.startsWith("/team")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && req.nextUrl.pathname === "/team") {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      const groupId = data.memberships?.[0]?.groupId;

      if (groupId) {
        return NextResponse.redirect(new URL(`/team/${groupId}`, req.url));
      }
    }
  }

  if (token && req.nextUrl.pathname.startsWith("/team/")) {
    const teamId = req.nextUrl.pathname.split("/")[2];

    if (!teamId) {
      return NextResponse.next();
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups/${teamId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL("/team", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/team/:path*", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

그 결과 아래와 같은 효과를 얻을 수 있었습니다.

- 인증되지 않은 사용자의 페이지 접근을 사전에 차단
- 중복된 권한 체크 로직 제거
- 화면 깜빡임 문제 해결

### Debounce

게시글 검색 기능에서 입력 완료 후 페이지가 이동하는 것이 아닌 입력할 때마다 검색 이벤트를 실행시켜서 결과를 보여주고 싶었습니다. 하지만 입력마다 요청을 보내는 점이 무겁게 느껴질 수 있기 때문에 Debounce 기법으로 검색 기능을 개선했습니다.
[useDebounce.ts](https://github.com/SanginJeong/Coworkers/blob/develop/src/hooks/useDebounce.ts)

```jsx
import { useEffect, useState } from "react";

const useDebounce = <T>(value: T, delay = 200): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
```

## 좋았던 점

- 새로 학습한 기술을 빠르게 도입하고 장단점을 체득할 수 있었습니다. (React Compiler, App Router)
- 협업 시 편리한 git hook을 활용한 자동화 및 테스트를 세팅하는 방법을 배우게 되었습니다.
- 팀원들과 매일 오랜시간 회의를 거치면서 프로젝트의 방향을 조정하고, 기술적으로도 토론을 했던 점이 학습하는데에 많은 도움이 되었습니다.

## 아쉬운 점

- App Router의 숙련도가 부족했습니다.
- 프로젝트 설계상 권한이 필요한 페이지가 많아서 동적 메타 데이터를 작성해줄만한 페이지가 없었습니다.
- device 크기에 따른 반응형 사이즈를 mobile, tablet, pc 로 나눠서 구현했으나, 경계선에서 깨지는 경우가 많았습니다. mobile, tablet, desktop, pc 4가지로 나누었다면 반응형 UI를 조금 더 디테일하게 구현할 수 있었을 것 같다고 느꼈습니다.
