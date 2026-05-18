import Image from "next/image";

import { cn } from "@/lib/utils";

export function Flag({
  code,
  alt,
  size = 40,
  className,
}: {
  code: string;
  alt: string;
  size?: 20 | 40 | 80 | 160;
  className?: string;
}) {
  return (
    <Image
      src={`https://flagcdn.com/w${size}/${code}.png`}
      alt={alt}
      width={size}
      height={Math.round(size * 0.6)}
      unoptimized
      className={cn("inline-block rounded-sm shadow-sm", className)}
    />
  );
}
