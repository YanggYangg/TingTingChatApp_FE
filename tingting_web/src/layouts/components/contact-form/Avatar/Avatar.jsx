export default function Avatar({ src, name, size = "md" }) {
  const initials = name
    ? name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "??";

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-base",
  };

  return (
    <div
      className={`relative ${sizeClasses[size]} rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold overflow-hidden`}
    >
      {src ? (
        <img
          src={src || "/placeholder.svg"}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
