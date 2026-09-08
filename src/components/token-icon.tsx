"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function TokenIcon({
  src,
  label,
  className,
}: {
  src: string;
  label: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        aria-hidden
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground",
          className,
        )}
      >
        {label.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt={`${label} logo`}
      width={20}
      height={20}
      className={cn("size-5 shrink-0 rounded-full", className)}
      onError={() => setFailed(true)}
    />
  );
}
