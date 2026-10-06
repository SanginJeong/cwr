"use client";

import dynamic from "next/dynamic";
import { toastKit } from "@/shared/lib/toastKit";
import { format } from "date-fns";
import TaskPdfDocument from "./_internal/TaskPdfDocument/TaskPdfDocument";
import { TaskResponse } from "@/shared/api/types/taskApi";

const PDFViewer = dynamic(() => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink), {
  ssr: false,
  loading: () => <p className="text-sm-medium text-text-primary">PDF 로딩중...</p>,
});

interface TaskPdfDownloadButtonProps {
  data: TaskResponse;
}

const TaskPdfDownloadButton = ({ data }: TaskPdfDownloadButtonProps) => {
  const { success, error: errorToast } = toastKit();

  const date = format(new Date(), "yyyy년_M월_d일");
  const fileName = `작업_보고서_${date}.pdf`;

  // 데이터가 바뀌면 PDF 문서를 새로 만든다. react-pdf는 요소가 사라지는 업데이트(예: 설명을 지움)를
  // 고치다가 "is not a function"으로 터진다. 할 일마다 수정 시각을 key에 넣어 업데이트 대신 다시 만들게 한다
  const documentKey = data?.map((task) => `${task.id}:${task.updatedAt}`).join("|") ?? "empty";

  return (
    <PDFViewer
      key={documentKey}
      document={<TaskPdfDocument data={data} />}
      fileName={fileName}
      onClick={() => {
        return true;
      }}
    >
      {({ loading, error }) => {
        if (error) {
          errorToast("PDF 생성에 실패하였습니다.");
        }
        return (
          <button
            type="button"
            disabled={loading || data?.length === 0}
            onClick={() => {
              success("PDF 다운로드가 완료되었습니다.");
              return true;
            }}
            className={`text-sm-medium ${data?.length === 0 ? "text-gray-500 cursor-not-allowed" : "text-text-primary"}`}
          >
            PDF 다운로드
          </button>
        );
      }}
    </PDFViewer>
  );
};

export default TaskPdfDownloadButton;
