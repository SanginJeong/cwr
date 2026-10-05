import instance from "@/shared/api/instance";
import { SignUpResponse, SignUpRequest } from "@/shared/api/types/authApi";

const postSignup = async (credentials: SignUpRequest): Promise<SignUpResponse> => {
  const { data } = await instance.post<SignUpResponse>("/auth/signUp", credentials);
  return data;
};

export default postSignup;
