import LoadingSpinner from "@/features/LoadingSpinner/LoadingSpinner";

const OverlayLoading = () => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background-secondary/60 backdrop-blur-[1px] rounded-[20px]">
      <LoadingSpinner size="lg" />
    </div>
  );
};

export default OverlayLoading;
