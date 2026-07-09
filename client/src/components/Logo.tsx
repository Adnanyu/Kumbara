export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 13H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 18H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="0.5 3.2" />
      </svg>
      <span className="font-display text-lg tracking-tight">Kumbara</span>
    </div>
  );
}
