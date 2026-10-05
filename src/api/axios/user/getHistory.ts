import instance from "@/lib/axios";
import { GetHistoryResponse } from "./type";

const getHistory = async (): Promise<GetHistoryResponse> => {
  const response = await instance.get<GetHistoryResponse>("/user/history");

  return response.data || [];
};

export default getHistory;
