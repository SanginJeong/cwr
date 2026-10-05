import instance from "@/shared/api/instance";

const deleteUser = async (): Promise<void> => {
  await instance.delete("/user");
};

export default deleteUser;
