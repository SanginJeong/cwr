import { flexCenter, flexColCenter, customShadow } from "./src/shared/config/tailwindPlugins";
import type { Config } from "tailwindcss";

const config: Config = {
  // FSD 레이어(app/views/widgets/features/entities/shared) 전체를 스캔한다
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    screens: {
      mobile: { max: "430px" }, // 0–430px
      tablet: { min: "431px" }, // 431–744px
      pc: { min: "940px" }, // 940px 이상
    },

    extend: {
      colors: {
        // 테마에 따라 바뀌는 색은 CSS 변수로 둔다 (값은 globals.css의 :root·.theme-dark).
        // 화면은 밝은 테마, 사이드바만 .theme-dark로 어두운 테마를 쓴다
        brand: {
          primary: "#5189FA",
          secondary: "rgb(var(--brand-secondary) / <alpha-value>)",
          tertiary: "#315296",
        },
        point: {
          purple: "#A855F7",
          cyan: "#06B6D4",
          blue: "#C9DAFD",
          pink: "#EC4899",
          rose: "#DBBAC0",
          orange: "#F97316",
          yellow: "#EAB308",
        },
        background: {
          primary: "rgb(var(--background-primary) / <alpha-value>)", // 카드·사이드바 등 표면
          secondary: "rgb(var(--background-secondary) / <alpha-value>)", // 페이지 배경
          tertiary: "rgb(var(--background-tertiary) / <alpha-value>)", // hover·강조 표면
          inverse: "rgb(var(--background-inverse) / <alpha-value>)",
        },
        interaction: {
          inactive: "#94A3B8",
          hover: "#416EC8",
          pressed: "#3B63B5",
          focus: "#416EC8",
        },
        border: {
          primary: "rgb(var(--border-primary) / <alpha-value>)",
          secondary: "rgb(var(--border-secondary) / <alpha-value>)",
        },
        text: {
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--text-tertiary) / <alpha-value>)",
          default: "rgb(var(--text-default) / <alpha-value>)",
          inverse: "#FFFFFF", // brand·danger 등 채색 배경 위 텍스트
          disabled: "rgb(var(--text-disabled) / <alpha-value>)",
        },
        status: {
          danger: "#FC4B4B",
        },
        // 접속 상태 점 (shared/config/presence.ts)
        presence: {
          online: "#22C55E",
          away: "#EAB308",
          offline: "#FC4B4B",
        },
        icon: {
          primary: "rgb(var(--icon-primary) / <alpha-value>)",
          inverse: "#F8FAFC",
          brand: "#74A1FB",
        },
        state: {
          200: "rgb(var(--state-200) / <alpha-value>)",
          300: "rgb(var(--state-300) / <alpha-value>)",
          400: "#94A3B8",
          600: "rgb(var(--state-600) / <alpha-value>)",
        },
      },

      borderColor: {
        DEFAULT: "rgb(var(--border-primary))", // 색 지정 없는 `border` 클래스 기본값 (border.primary)
      },

      fontFamily: {
        pretendard: ["Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", "sans-serif"],
      },

      fontSize: {
        "4xl-brand-bold": ["48px", { lineHeight: "57px", fontWeight: "700" }],
        "4xl": ["40px", { lineHeight: "48px", fontWeight: "500" }],
        "3xl-brand-bold": ["36px", { lineHeight: "43px", fontWeight: "700" }],
        "3xl-bold": ["32px", { lineHeight: "38px", fontWeight: "700" }],
        "3xl-semibold": ["32px", { lineHeight: "38px", fontWeight: "600" }],
        "2xl-brand-bold": ["28px", { lineHeight: "38px", fontWeight: "700" }],
        "2xl-bold": ["24px", { lineHeight: "28px", fontWeight: "700" }],
        "2xl-semibold": ["24px", { lineHeight: "28px", fontWeight: "600" }],
        "2xl-medium": ["24px", { lineHeight: "28px", fontWeight: "500" }],
        "2xl-regular": ["24px", { lineHeight: "28px", fontWeight: "400" }],
        "xl-bold": ["20px", { lineHeight: "24px", fontWeight: "700" }],
        "xl-semibold": ["20px", { lineHeight: "24px", fontWeight: "600" }],
        "xl-medium": ["20px", { lineHeight: "24px", fontWeight: "500" }],
        "xl-regular": ["20px", { lineHeight: "24px", fontWeight: "400" }],
        "2lg-bold": ["18px", { lineHeight: "21px", fontWeight: "700" }],
        "2lg-semibold": ["18px", { lineHeight: "21px", fontWeight: "600" }],
        "2lg-medium": ["18px", { lineHeight: "21px", fontWeight: "500" }],
        "2lg-regular": ["18px", { lineHeight: "21px", fontWeight: "400" }],
        "lg-bold": ["16px", { lineHeight: "19px", fontWeight: "700" }],
        "lg-semibold": ["16px", { lineHeight: "19px", fontWeight: "600" }],
        "lg-medium": ["16px", { lineHeight: "19px", fontWeight: "500" }],
        "lg-regular": ["16px", { lineHeight: "19px", fontWeight: "400" }],
        "md-bold": ["14px", { lineHeight: "17px", fontWeight: "700" }],
        "md-semibold": ["14px", { lineHeight: "17px", fontWeight: "600" }],
        "md-medium": ["14px", { lineHeight: "17px", fontWeight: "500" }],
        "md-regular": ["14px", { lineHeight: "17px", fontWeight: "400" }],
        "sm-semibold": ["13px", { lineHeight: "16px", fontWeight: "600" }],
        "sm-medium": ["13px", { lineHeight: "16px", fontWeight: "500" }],
        "xs-semibold": ["12px", { lineHeight: "14px", fontWeight: "600" }],
        "xs-medium": ["12px", { lineHeight: "14px", fontWeight: "500" }],
        "xs-regular": ["12px", { lineHeight: "14px", fontWeight: "400" }],
      },
    },
  },
  plugins: [flexCenter, flexColCenter, customShadow],
};

export default config;
