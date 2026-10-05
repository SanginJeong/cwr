import instance from "@/shared/api/instance";
import { UserResponse } from "@/shared/api/types/UserType";

const getUser = async (): Promise<UserResponse> => {
  const { data } = await instance.get<UserResponse>("/user");
  return data;
};

export default getUser;
