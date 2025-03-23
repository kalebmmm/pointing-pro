import { cn } from "@/lib/utils";
import type React from "react";

const baseStyles =
  "flex aspect-[3/4] h-24 items-center justify-center rounded-sm border bg-white text-2xl shadow";

export const PointButton = (props: React.ComponentProps<"button">) => {
  return (
    <button
      {...props}
      className={cn(
        `${baseStyles} transition-[translate] active:-translate-y-1`,
        props.className,
      )}
    >
      {props.children}
    </button>
  );
};

export const PointCard = (props: React.ComponentProps<"div">) => {
  return (
    <div {...props} className={cn(`${baseStyles}`, props.className)}>
      {props.children}
    </div>
  );
};
