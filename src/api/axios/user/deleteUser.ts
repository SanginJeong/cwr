import instance from "@/lib/axios";

const deleteUser = async (): Promise<void> => {
  await instance.delete("/user");
};

export default deleteUser;
