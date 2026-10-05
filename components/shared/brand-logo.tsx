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
      src="/logo.png"
      alt="Logo DICA"
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 rounded-full object-cover", className)}
    />
  );
}
