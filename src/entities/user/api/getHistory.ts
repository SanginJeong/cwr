import instance from "@/shared/api/instance";
import { GetHistoryResponse } from "@/shared/api/types/userApi";
import getHistoryWithSupabase from "./getHistory.supabase";
import { isSupabase } from "@/shared/config/backend";

const getHistory = async (): Promise<GetHistoryResponse> => {
  if (isSupabase) return getHistoryWithSupabase();

  const response = await instance.get<GetHistoryResponse>("/user/history");

  return response.data || [];
};

export default getHistory;
