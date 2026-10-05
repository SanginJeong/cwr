"use client";

import LoadingSpinner from "@/shared/ui/spinner/LoadingSpinner";
import dynamic from "next/dynamic";

const MyPageContainer = dynamic(() => import("./MypageContainer"), {
  ssr: false,
  loading: () => <LoadingSpinner className="h-full flex-center" size="lg" />,
});

const MyPage = () => {
  return <MyPageContainer />;
};

export default MyPage;
