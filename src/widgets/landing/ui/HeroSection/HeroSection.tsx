"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/shared/lib/cn";
import { LinkButton } from "@/shared/ui/link-button";
import { ROUTES } from "@/shared/config/routes";

interface HeroSectionProps {
  link?: string;
}

// 첫 섹션은 이름과 시작하기만 둔다. 화면 이미지는 아래 섹션들이 보여준다
const HeroSection = ({ link = ROUTES.login }: HeroSectionProps) => {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".hero-text-item", {
        x: -50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
      });
    },
    { scope: container },
  );

  return (
    <section ref={container} className="overflow-hidden bg-background-secondary">
      <div
        className={cn(
          "flex flex-col gap-8 px-[20px] py-[56px]",
          "tablet:gap-10 tablet:px-[35px] tablet:py-[88px]",
          "pc:px-[76px] pc:py-[120px]",
        )}
      >
        <div className="hero-text-item">
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
        <LinkButton href={link} size="large" className="hero-text-item ml-[30px] w-[160px]">
          지금 시작하기
        </LinkButton>
      </div>
    </section>
  );
};

export default HeroSection;
