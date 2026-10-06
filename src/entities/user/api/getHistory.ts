import { GetHistoryResponse } from "@/shared/api/types/userApi";
import getHistoryWithSupabase from "./getHistory.supabase";

const getHistory = async (): Promise<GetHistoryResponse> => {
  return getHistoryWithSupabase();
};

export default getHistory;
