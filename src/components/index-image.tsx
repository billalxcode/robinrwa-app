"use client";

import Image from "next/image";
import { useState } from "react";
import { robinscanLogo } from "@/lib/assets";
import { ipfsUrl } from "@/lib/ipfs";
import { cn } from "@/lib/utils";

// Index artwork from the on-chain imageCID via the IPFS gateway.
// Indexes without an image always show the Robinhood logo.
// Mirrors the TokenIcon pattern.
export function IndexImage({
  cid,
  alt,
  className,
  imageClassName,
}: {
  cid: string;
  alt: string;
  className?: string;
  imageClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = failed
    ? robinscanLogo("HOOD")
    : (ipfsUrl(cid) ?? robinscanLogo("HOOD"));
  return (
    <span
      className={cn(
        "relative block size-10 shrink-0 overflow-hidden rounded-xl border border-border bg-muted",
        className,
      )}
    >
      <Image
        src={url}
        alt={alt}
        fill
        sizes="80px"
        className={cn("object-cover", imageClassName)}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
