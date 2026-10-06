import { useRef, useState } from "react";
import { toastKit } from "@/shared/lib/toastKit";
import { validateTeamName } from "@/shared/lib/Validation";
import { useGetUser } from "@/entities/user";
import usePostCreateTeam from "../api/usePostCreateTeam";
import useImageUpload from "@/shared/lib/useImageUpload";
import { resolveTeamImageUrl } from "../lib/resolveTeamImage";

interface UseCreateTeamFlowReturn {
  name: string;
  errorMessage: string;
  preview: string;
  file: File | null;
  isValid: boolean;
  isSubmitting: boolean;
  handleNameChange: (value: string) => void;
  handleImageChange: (file: File) => void;
  handleSubmit: () => Promise<void>;
}

const useTeamCreation = (): UseCreateTeamFlowReturn => {
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const { error } = toastKit();
  const { data: userData } = useGetUser();
  const { mutate: createTeam } = usePostCreateTeam();
  const { preview, file, handleImageChange, uploadImage } = useImageUpload();

  const isValid = name.trim().length >= 1 && name.trim().length <= 30;

  const handleNameChange = (value: string) => {
    setName(value);
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;

    const nameValidation = validateTeamName(name, userData?.memberships);
    if (!nameValidation.isValid) {
      setErrorMessage(nameValidation.error);
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const trimmedName = name.trim();
      const imageUrl = await resolveTeamImageUrl(file, trimmedName, uploadImage);

      createTeam(
        { name: trimmedName, image: imageUrl },
        {
          onError: (err) => {
            isSubmittingRef.current = false;
            setIsSubmitting(false);

            // 같은 이름의 팀은 서버에서 허용한다 (내 팀 안의 중복은 validateTeamName이 미리 막음)
            error(err instanceof Error ? err.message : "팀 생성에 실패했습니다.");
          },
        },
      );
    } catch {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return {
    name,
    errorMessage,
    preview,
    file,
    isValid,
    isSubmitting,
    handleNameChange,
    handleImageChange,
    handleSubmit,
  };
};

export default useTeamCreation;
