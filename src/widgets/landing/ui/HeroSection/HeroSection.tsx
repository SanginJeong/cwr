"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/shared/lib/cn";
import DeviceImage from "../_internal/DeviceImage/DeviceImage";
import { LinkButton } from "@/shared/ui/link-button";
import { ROUTES } from "@/shared/config/routes";

interface HeroSectionProps {
  link?: string;
}

const HeroSection = ({ link = ROUTES.login }: HeroSectionProps) => {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline();

      tl.from(".hero-text-item", {
        x: -50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
      })

        .from(
          ".hero-image",
          {
            x: 50,
            opacity: 0,
            duration: 1,
            ease: "power2.out",
          },
          "-=0.4",
        );
    },
    { scope: container },
  );

  return (
    <section ref={container} className={cn("overflow-hidden bg-background-secondary pc:px-8 pc:py-[80px]")}>
      <div
        className={cn(
          // 모바일·태블릿의 "지금 시작하기"는 아래에 겹쳐 두므로 그 자리(pb)를 비워 표를 가리지 않게 한다
          "relative flex flex-col justify-between pb-[116px] pc:pb-0",
          "pc:gap-10 pc:max-w-[1600px] pc:mx-auto wide:flex-row wide:items-center wide:gap-16",
        )}
      >
        <div className="flex flex-col gap-10 pc:shrink-0 pc:pl-[44px] hero-text-item">
          <div className={cn("pl-[20px] pt-[34px]", "tablet:pl-[35px] tablet:pt-[89px]", "pc:pt-0 pc:pl-0")}>
            <Image
              src="/landing/land-1.svg"
              alt=""
              width={48}
              height={48}
              className="size-9 pc:size-12"
              draggable={false}
            />
            <div className="ml-[30px]">
              <p className="text-md-medium tablet:text-lg-medium pc:text-xl-medium text-state-400">
                출퇴근부터 휴가 승인까지
              </p>
              <h1 className="text-2xl-brand-bold tablet:text-3xl-brand-bold pc:text-4xl-brand-bold text-brand-primary mt-1">
                Coworkers
              </h1>
            </div>
          </div>
          <LinkButton href={link} size="large" className="mobile:hidden tablet:hidden pc:flex ml-[30px] w-[160px]">
            지금 시작하기
          </LinkButton>
        </div>
        {/* 다음 섹션(내 근태)과 겹치지 않게 인사담당자 화면을 보여준다. wide(1280px)부터 글 옆에 두고 남은 폭에 맞춰 줄인다 */}
        <div className={cn("min-w-full mt-6 pc:mt-0 pc:min-w-0 wide:flex-1 wide:max-w-[900px]", "hero-image")}>
          <DeviceImage
            ImageInfo={{
              alt: "직원별 근태 정책, 이번 달 근태와 오늘 출근 상태가 보이는 구성원 관리 화면",
              width: 1120,
              height: 720,
            }}
            Src={{
              mobileSrc: "/landing/hero-members-mobile.png",
              tabletSrc: "/landing/hero-members-tablet.png",
              desktopSrc: "/landing/hero-members.png",
            }}
            ImageClassName="w-full h-auto pc:rounded-2xl pc:shadow-[0_8px_30px_rgba(30,41,59,0.10)]"
          />
        </div>
        <LinkButton
          href={link}
          size="large"
          className="hero-image flex w-[160px] absolute bottom-[52px] right-4 tablet:right-8 pc:hidden"
        >
          지금 시작하기
        </LinkButton>
      </div>
    </section>
  );
};

export default HeroSection;
