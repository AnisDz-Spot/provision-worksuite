export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        width="100"
        height="100"
        rx="20"
        fill="currentColor"
        className="text-primary"
      />
      <path
        d="M30 35 L50 25 L70 35 L70 65 L50 75 L30 65 Z"
        fill="white"
        className="text-primary-foreground"
      />
      <circle
        cx="50"
        cy="50"
        r="8"
        fill="currentColor"
        className="text-primary"
      />
    </svg>
  );
}
