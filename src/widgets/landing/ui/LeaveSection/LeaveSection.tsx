"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/ScrollTrigger";
import DeviceImage from "../_internal/DeviceImage/DeviceImage";
import FeatureBlock from "../_internal/FeatureBlock/FeatureBlock";
import { LEAVE_SECTION } from "../../config/constants";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const LeaveSection = () => {
  const container = useRef<HTMLDListElement>(null);

  useGSAP(
    () => {
      gsap.from(".feature-block", {
        scrollTrigger: {
          trigger: ".feature-block",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
      });

      gsap.from(".feature-image", {
        scrollTrigger: {
          trigger: ".feature-image",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
        y: 30,
        opacity: 0,
        duration: 1,
        delay: 0.2,
        ease: "power3.out",
      });
    },
    { scope: container },
  );

  return (
    <section ref={container} className="pt-[45px] pc:pt-[83px] bg-brand-primary">
      <div className="flex flex-col gap-[30px] pc:gap-[108px] pc:flex-row-reverse pc:justify-center">
        <div className="feature-block">
          <FeatureBlock
            iconSrc={LEAVE_SECTION.iconSrc}
            iconAlt=""
            title={LEAVE_SECTION.title}
            description={LEAVE_SECTION.description}
            titleClassName="text-lg-bold tablet:text-2xl-bold text-text-inverse"
            descriptionClassName="text-xs-regular tablet:text-md-regular text-point-blue"
            className="pc:mt-[180px] pc:ml-[0] pc:mr-[35px]"
          />
        </div>
        <div className="feature-image relative min-h-0 tablet:ml-[45px] pc:ml-0">
          <DeviceImage
            ImageInfo={{ alt: LEAVE_SECTION.imageAlt, width: 982, height: 667 }}
            Src={{
              mobileSrc: LEAVE_SECTION.mobileSrc,
              tabletSrc: LEAVE_SECTION.tabletSrc,
              desktopSrc: LEAVE_SECTION.desktopSrc,
            }}
            // PC에서 982px로 고정하면 사이드바가 있는 화면(~1440px)에서 왼쪽이 밖으로 밀려 잘렸다. 화면 폭에 맞춰 줄인다
            ImageClassName="object-cover object-right w-full h-full pc:w-[min(982px,50vw)] pc:h-auto"
          />
        </div>
      </div>
    </section>
  );
};

export default LeaveSection;
