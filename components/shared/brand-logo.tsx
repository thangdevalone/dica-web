import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  size,
  className,
  priority = false,
}: {
  size: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/android-chrome-512x512.png"
      alt="Logo DICA"
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 rounded-full object-cover", className)}
    />
  );
}
