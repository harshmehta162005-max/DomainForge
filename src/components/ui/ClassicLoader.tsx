export function ClassicLoader({ className }: { className?: string }) {
  return (
    <div className={`border-primary flex h-10 w-10 animate-spin items-center justify-center rounded-full border-4 border-t-transparent ${className || ""}`}></div>
  );
}
