import useGetUser from "../api/useGetUser";

/** 인사담당자인지 (ADR-006). 화면 표시용이고, 실제 권한은 DB(RLS, is_hr_admin)가 확인한다 */
const useIsHrAdmin = () => {
  const { data: user } = useGetUser();
  return user?.companyRole === "HR_ADMIN";
};

export default useIsHrAdmin;
