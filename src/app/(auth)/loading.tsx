export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080310]">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
