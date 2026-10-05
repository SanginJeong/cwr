"use client";

import Image from "next/image";
import { cn } from "@/shared/lib/cn";
import { ProfileProps } from "./_type/types";
import { PROFILE_SIZE, PROFILE_IMAGE_SIZE, PROFILE_ICON_SIZE, DEFAULT_ICON_SIZE } from "./PROFILE_SIZE_STYLES";
import IcUser from "@/shared/assets/icon/ic-user.svg?url";
import useImageError from "./_hook/useImageError";
import StatusDot from "./StatusDot";

/**
 * @author KimWonSeon
 * @description 프로필 컴포넌트입니다.
 *
 * @param src - 이미지 URL, 없을 시 기본 이미지
 * @param alt - 이미지 대체 텍스트
 * @param size - sm, md, lg 프로필 크기 옵션
 * @param status - 접속 상태. 있으면 오른쪽 아래에 점을 표시
 */

const Profile = ({ src, alt = "프로필", size = "lg", status }: ProfileProps) => {
  const { hasError, handleError } = useImageError(src);

  const hasImage = src && !hasError;

  const image = (
    <div
      className={cn(
        "overflow-hidden border border-background-tertiary bg-background-tertiary flex-center flex-shrink-0",
        PROFILE_SIZE[size],
        hasImage ? "bg-transparent" : "bg-background-tertiary",
      )}
    >
      {hasImage ? (
        <Image
          src={src}
          alt={alt}
          width={PROFILE_IMAGE_SIZE[size]}
          height={PROFILE_IMAGE_SIZE[size]}
          quality={85}
          className="w-full h-full object-cover"
          onError={handleError}
        />
      ) : (
        <Image
          src={IcUser}
          alt="기본 프로필"
          width={DEFAULT_ICON_SIZE[size]}
          height={DEFAULT_ICON_SIZE[size]}
          quality={85}
          className={PROFILE_ICON_SIZE[size]}
        />
      )}
    </div>
  );

  if (!status) return image;

  // 사진 영역은 overflow-hidden이라 점을 바깥 래퍼에 둔다
  return (
    <div className="relative flex-shrink-0">
      {image}
      <StatusDot status={status} size={size} className="absolute -bottom-1 -right-1" />
    </div>
  );
};

export default Profile;
