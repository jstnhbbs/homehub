import Image from "next/image";

export function hasProfilePhoto(avatar: string) {
  try {
    return new URL(avatar).hostname.endsWith(
      ".public.blob.vercel-storage.com",
    );
  } catch {
    return false;
  }
}

export function ProfileAvatar({
  name,
  avatar,
  color,
  size = 48,
  className = "",
}: {
  name: string;
  avatar: string;
  color: string;
  size?: number;
  className?: string;
}) {
  const hasPhoto = hasProfilePhoto(avatar);
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-extrabold text-white ${className}`}
      style={{ width: size, height: size, background: color }}
      aria-label={`${name}'s profile photo`}
    >
      {hasPhoto ? (
        <Image
          src={avatar}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
