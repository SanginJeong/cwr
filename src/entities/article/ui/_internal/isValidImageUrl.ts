/**
 * 게시글 이미지로 그려도 되는 주소인지. 우리 Supabase Storage의 images 버킷 공개 URL만 허용한다.
 * (예전에는 기존 백엔드의 S3 주소만 허용해서, Supabase에 올린 이미지가 화면에 나오지 않았다)
 */
const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;
const IMAGES_PATH = "/storage/v1/object/public/images/";

const isValidImageUrl = (url: string) => {
  try {
    const { hostname, pathname } = new URL(url);
    return hostname === SUPABASE_HOST && pathname.startsWith(IMAGES_PATH);
  } catch {
    return false;
  }
};

export default isValidImageUrl;
