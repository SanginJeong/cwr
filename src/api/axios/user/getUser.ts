import instance from "@/lib/axios";
import { UserResponse } from "@/types/UserType";

const getUser = async (): Promise<UserResponse> => {
  const { data } = await instance.get<UserResponse>("/user");
  return data;
};

export default getUser;
