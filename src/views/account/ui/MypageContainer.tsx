"use client";

import { notFound } from "next/navigation";
import useGetUser from "@/entities/user/api/useGetUser";
import BaseButton from "@/shared/ui/button/BaseButton";
import LoadingSpinner from "@/shared/ui/spinner/LoadingSpinner";
import ErrorState from "@/shared/ui/error-state/ErrorState";
import MyPageContent from "./MyPageContent/MyPageContent";

const MyPageContainer = () => {
  const { data: userData, isLoading, isError, refetch } = useGetUser();

  if (isLoading) {
    return <LoadingSpinner className="h-full flex-center" size="lg" />;
  }

  if (isError) {
    return (
      <div className="w-full h-full flex-col-center gap-6">
        <ErrorState />
        <BaseButton variant="solid" size="large" onClick={() => refetch()} className="w-[160px]">
          다시 시도하기
        </BaseButton>
      </div>
    );
  }

  if (!userData) {
    notFound();
  }

  return <MyPageContent userData={userData} />;
};

export default MyPageContainer;
