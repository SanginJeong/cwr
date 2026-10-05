"use client";

import { useGetHistory } from "@/entities/user";
import { PageHeaderBar } from "@/widgets/page-header-bar";
import { PageLayout } from "@/shared/ui/page-layout";
import WorkHistorySection from "./WorkHistorySection/WorkHistorySection";

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
