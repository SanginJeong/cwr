"use client";

import useGetHistory from "@/api/hooks/user/useGetHistory";
import PageHeaderBar from "@/common/PageHeaderBar/PageHeaderBar";
import PageLayout from "@/common/PageLayout/PageLayout";
import WorkHistorySection from "./_components/WorkHistorySection/WorkHistorySection";

const MyHistoryPage = () => {
  const { data: historyData, isPending, isError } = useGetHistory();

  return (
    <PageLayout ariaLabel="나의 히스토리">
      <h1 className="sr-only">나의 히스토리</h1>
      <PageHeaderBar title="나의 히스토리" isDropdown={false} />

      <WorkHistorySection data={historyData ?? { tasksDone: [] }} isLoading={isPending} isError={isError} />
    </PageLayout>
  );
};

export default MyHistoryPage;
