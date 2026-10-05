/**
 * Supabase 에러를 화면에 보여줄 수 있는 Error로 바꾼다.
 *
 * RPC 에러 코드 (supabase/README.md)
 *   42501 → 403, P0002 → 404, P0001 → 400 (메시지가 사용자용 문장)
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    /** 폼의 어느 필드 에러인지 (예: "email", "nickname") */
    public field?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface SupabaseErrorLike {
  message: string;
  code?: string;
  status?: number;
}

const STATUS_BY_CODE: Record<string, number> = {
  "42501": 403,
  P0002: 404,
  P0001: 400,
  "23505": 409,
};

export const toApiError = (error: SupabaseErrorLike, fallbackMessage = "요청에 실패했습니다."): ApiError => {
  const status = (error.code && STATUS_BY_CODE[error.code]) || error.status || 500;
  // P0001은 SQL에서 사용자용 문장으로 던진다. 나머지는 내부 메시지라 그대로 보여주지 않는다
  const message = error.code === "P0001" ? error.message : fallbackMessage;
  return new ApiError(message, status);
};

/** RLS에 막힌 update/delete는 에러 없이 0건이다. 결과 행이 없으면 404로 본다 */
export const assertAffected = <T>(rows: T[] | null, message = "대상을 찾을 수 없거나 권한이 없습니다.") => {
  if (!rows || rows.length === 0) throw new ApiError(message, 404);
  return rows;
};
