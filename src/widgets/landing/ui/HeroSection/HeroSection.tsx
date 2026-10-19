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
    <section ref={container} className={cn("overflow-hidden bg-background-secondary pc:pl-8")}>
      <div className={cn("relative flex flex-col justify-between", "pc:flex-row pc:gap-28")}>
        <div className="flex flex-col justify-between pc:pl-[44px] pc:mb-[228px] hero-text-item">
          <div className={cn("pl-[20px] pt-[34px]", "tablet:pl-[35px] tablet:pt-[89px]", "pc:pt-[208px] pc:pl-0")}>
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
        <div className={cn("min-w-full pc:min-w-[1330px]", "hero-image")}>
          <DeviceImage
            ImageInfo={{
              alt: "이번 달 근태 요약과 달력, 오늘 출근 카드가 보이는 내 근태 화면",
              width: 1330,
              height: 1080,
            }}
            Src={{
              mobileSrc: "/landing/hero-mobile.png",
              tabletSrc: "/landing/hero-tablet.png",
              desktopSrc: "/landing/hero.png",
            }}
            ImageClassName="object-contain object-left w-full h-full"
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
