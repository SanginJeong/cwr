import { ReactNode } from "react";

interface SectionContent {
  title: ReactNode;
  description: ReactNode;
  /** 화면 낭독기가 읽는 이미지 설명 */
  imageAlt: string;
  iconSrc: string;
  mobileSrc: string;
  tabletSrc: string;
  desktopSrc: string;
}

// 이미지는 로컬 시드(가상 인물)로 찍은 실제 화면이다. 화면이 바뀌면 같은 크기로 다시 찍는다

export const ATTENDANCE_SECTION: SectionContent = {
  title: (
    <>
      출근 버튼 하나로
      <br /> 근태가 기록돼요
    </>
  ),
  description: (
    <>
      근태 정책에 맞춰 정상·지각·결근이 자동으로 판정되고
      <br /> 한 달 기록을 달력으로 한눈에 봐요
    </>
  ),
  imageAlt: "정상·지각 판정과 휴가가 표시된 내 근태 달력",
  iconSrc: "/landing/land-2.svg",
  mobileSrc: "/landing/attendance-mobile.png",
  tabletSrc: "/landing/attendance-tablet.png",
  desktopSrc: "/landing/attendance.png",
};

export const LEAVE_SECTION: SectionContent = {
  title: (
    <>
      휴가 신청부터 승인까지
      <br /> 한 곳에서 끝나요
    </>
  ),
  description: (
    <>
      직원은 날짜를 골라 신청하고
      <br /> 팀장은 겹치는 일정을 보며 바로 승인해요
    </>
  ),
  imageAlt: "대기 중인 휴가 신청 목록과 팀 휴가 달력",
  iconSrc: "/landing/land-3.svg",
  mobileSrc: "/landing/leave-mobile.png",
  tabletSrc: "/landing/leave-tablet.png",
  desktopSrc: "/landing/leave.png",
};

export const TEAM_SECTION: SectionContent = {
  title: (
    <>
      오늘 우리 팀의 근태와
      <br /> 할 일을 함께 봐요
    </>
  ),
  description: (
    <>
      누가 출근했는지, 할 일이 얼마나 진행됐는지
      <br /> 팀원 모두가 같은 화면으로 확인해요
    </>
  ),
  imageAlt: "오늘 우리 팀 근태와 멤버 출근 현황, 할 일 목록이 보이는 팀 페이지",
  iconSrc: "/landing/land-4.svg",
  mobileSrc: "/landing/team-mobile.png",
  tabletSrc: "/landing/team-tablet.png",
  desktopSrc: "/landing/team.png",
};
