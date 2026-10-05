const ALLOWED_IMAGE_HOSTS = ["sprint-fe-project.s3.ap-northeast-2.amazonaws.com"];

const isValidImageUrl = (url: string) => {
  try {
    return ALLOWED_IMAGE_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
};

export default isValidImageUrl;
