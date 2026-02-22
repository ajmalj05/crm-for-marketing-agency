"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** Size: "sm" (sidebar), "md" (login header), "lg" (optional) */
  size?: "sm" | "md";
  /** If true, wrap in Link to / */
  link?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-[120px]",
  md: "h-10 w-[160px] sm:h-12 sm:w-[180px]",
};

export function Logo({ size = "sm", link = true, className }: LogoProps) {
  const [imgError, setImgError] = useState(false);

  const content = imgError ? (
    <span className={cn("font-bold tracking-tight text-black", size === "sm" ? "text-base" : "text-lg")}>
      GROW<span className="text-[hsl(var(--primary))]">TH</span>
    </span>
  ) : (
    <div className={cn("relative shrink-0 overflow-hidden", sizeClasses[size], className)}>
      <Image
        src="/logo.png"
        alt="Growith Marketing agency"
        fill
        className="object-contain object-left"
        unoptimized
        onError={() => setImgError(true)}
        sizes={size === "sm" ? "120px" : "180px"}
      />
    </div>
  );

  if (link) {
    return (
      <Link href="/dashboard" className="flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }
  return <div className="flex items-center">{content}</div>;
}
