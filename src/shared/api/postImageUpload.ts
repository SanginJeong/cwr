import postImageUploadWithSupabase from "./postImageUpload.supabase";

const postImageUpload = async (file: File): Promise<string> => {
  return postImageUploadWithSupabase(file);
};

export default postImageUpload;
