import type { Membership, User } from "@/shared/api/types/UserType";

/**
 * get_me RPC 응답 → 기존 User 타입.
 * RPC가 이미 camelCase로 조립하므로 기존 API에만 있던 필드(teamId)만 채운다.
 */
type MeJson = Omit<User, "teamId" | "memberships"> & {
  memberships: (Omit<Membership, "group"> & { group: Omit<Membership["group"], "teamId"> })[];
};

export const mapMe = (json: MeJson): User => ({
  ...json,
  image: json.image ?? "",
  teamId: "",
  memberships: json.memberships.map((m) => ({
    ...m,
    userImage: m.userImage ?? "",
    group: { ...m.group, image: m.group.image ?? "", teamId: "" },
  })),
});
