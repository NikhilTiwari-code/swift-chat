// Colorful Avatar component — generates consistent color from name
// No external API needed — works offline too

const COLORS = [
  { bg: "bg-emerald-500", text: "text-white" },
  { bg: "bg-violet-500",  text: "text-white" },
  { bg: "bg-rose-500",    text: "text-white" },
  { bg: "bg-amber-500",   text: "text-white" },
  { bg: "bg-sky-500",     text: "text-white" },
  { bg: "bg-pink-500",    text: "text-white" },
  { bg: "bg-indigo-500",  text: "text-white" },
  { bg: "bg-teal-500",    text: "text-white" },
  { bg: "bg-orange-500",  text: "text-white" },
  { bg: "bg-cyan-500",    text: "text-white" },
];

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % COLORS.length;
}

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
};

export function Avatar({ name, avatarUrl, size = "md", className = "" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const colorIdx = getColorIndex(name);
  const { bg, text } = COLORS[colorIdx];
  const sizeClass = SIZE_MAP[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`rounded-full object-cover ${sizeClass} ${className}`}
        onError={(e) => {
          // fallback to initials if image fails
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${bg} ${text} ${sizeClass} ${className}`}
    >
      {initials || "?"}
    </div>
  );
}
