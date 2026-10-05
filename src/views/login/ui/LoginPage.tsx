import LoginForm from "@/features/auth/login/ui/LoginForm/LoginForm";
import CenteredCardLayout from "@/shared/ui/centered-card-layout/CenteredCardLayout";
import SocialAuthSection from "@/features/auth/kakao-login/ui/SocialAuthSection/SocialAuthSection";

const LoginPage = () => {
  return (
    <CenteredCardLayout
      className="min-w-[343px] max-h-[670px] max-w-[550px] py-[60px] tablet:py-[70px]"
      title="로그인"
      titleClassName="text-xl-bold"
    >
      <LoginForm />
      <SocialAuthSection mode="login" />
    </CenteredCardLayout>
  );
};

export default LoginPage;
