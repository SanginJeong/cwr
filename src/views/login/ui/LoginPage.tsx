import { LoginForm } from "@/features/auth/login";
import { DemoLoginSection } from "@/features/auth/demo-login";
import { CenteredCardLayout } from "@/shared/ui/centered-card-layout";

const LoginPage = () => {
  return (
    <CenteredCardLayout
      className="min-w-[343px] max-w-[550px] py-[60px] tablet:py-[70px]"
      title="로그인"
      titleClassName="text-xl-bold"
    >
      <LoginForm />
      <DemoLoginSection />
    </CenteredCardLayout>
  );
};

export default LoginPage;
