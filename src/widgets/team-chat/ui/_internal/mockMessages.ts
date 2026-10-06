import { GroupMember } from "@/shared/api/types/GroupData";

/**
 * 팀 채팅 목업용 예시 메시지. 실제 채팅은 아직 없다 (docs/roadmap.md "팀 채팅").
 * 팀원 이름·사진만 실제 데이터를 쓰고, 내용과 시각은 고정된 예시다.
 */
export interface MockMessage {
  id: number;
  member: Pick<GroupMember, "userId" | "userName" | "userImage">;
  content: string;
  time: string;
}

const SAMPLE_CONTENTS = [
  "오늘 스탠드업 10시에 할게요!",
  "디자인 시안 올려뒀어요. 확인 부탁드려요 🙏",
  "할 일 목록에 QA 항목 추가했습니다.",
  "넵 확인했어요. 오후에 리뷰할게요.",
];
const SAMPLE_TIMES = ["오전 9:41", "오전 10:02", "오전 11:15", "오후 1:30"];

export const buildMockMessages = (members: GroupMember[]): MockMessage[] => {
  const speakers = members.length > 0 ? members : [{ userId: 0, userName: "팀원", userImage: null }];
  return SAMPLE_CONTENTS.map((content, index) => ({
    id: index,
    member: speakers[index % speakers.length],
    content,
    time: SAMPLE_TIMES[index],
  }));
};
