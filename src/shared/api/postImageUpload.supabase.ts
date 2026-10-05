import { getSupabase } from "@/shared/api/supabase/client";
import { ApiError } from "@/shared/api/supabase/errors";

const MAX_SIZE = 10 * 1024 * 1024;

/**
 * images 버킷의 {auth uid}/ 폴더에 올리고 공개 URL을 돌려준다.
 * 10MB 제한과 이미지 MIME 검사는 버킷 설정에도 있다 (supabase/migrations/..._articles_storage.sql)
 */
const postImageUploadWithSupabase = async (file: File): Promise<string> => {
  if (file.size > MAX_SIZE) throw new ApiError("파일 크기가 너무 큽니다. (최대 10MB)", 413);
  if (!file.type.startsWith("image/")) throw new ApiError("지원하지 않는 파일 형식입니다.", 400);

  const supabase = getSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new ApiError("로그인이 필요합니다.", 401);

  const ext = file.name.includes(".") ? file.name.split(".").pop() : file.type.split("/")[1];
  const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("images").upload(path, file, { contentType: file.type });
  if (error) throw new ApiError("이미지 업로드에 실패했습니다.", 500);

  return supabase.storage.from("images").getPublicUrl(path).data.publicUrl;
};

export default postImageUploadWithSupabase;
