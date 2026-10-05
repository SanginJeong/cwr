import instance from "@/shared/api/instance";
import { GetHistoryResponse } from "@/shared/api/types/userApi";

const getHistory = async (): Promise<GetHistoryResponse> => {
  const response = await instance.get<GetHistoryResponse>("/user/history");

  return response.data || [];
};

export default getHistory;
