"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Scissors } from "lucide-react";
import { resolveServiceImageCandidates } from "@/lib/service-images";

type Props = {
  name: string;
  category: string | null;
  /** Size / shape classes, e.g. "h-20 w-20 rounded-lg". */
  className?: string;
};

/**
 * Thumbnail for a service. Picks the best shared image from the resolver and,
 * if a file is missing or fails to load, quietly steps down to the category
 * image, then the default, then a plain placeholder — never a broken image.
 */
export function ServiceImage({ name, category, className = "h-20 w-20 rounded-lg" }: Props) {
  const candidates = useMemo(() => resolveServiceImageCandidates(name, category), [name, category]);
  const key = candidates.join("|");
  const [state, setState] = useState({ key, index: 0 });
  const index = state.key === key ? state.index : 0;
  const imgRef = useRef<HTMLImageElement | null>(null);

  const failed = () => setState({ key, index: index + 1 });

  // An image can fail before React attaches onError (server-rendered HTML).
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) {
      setState({ key, index: index + 1 });
    }
  }, [key, index]);

  if (index >= candidates.length) {
    return (
      <div
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center bg-[#F7F3ED] text-[#CCC6BD] ${className}`}
      >
        <Scissors className="h-1/3 w-1/3" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={candidates[index]}
      ref={imgRef}
      src={candidates[index]}
      alt=""
      loading="lazy"
      decoding="async"
      width={104}
      height={104}
      onError={failed}
      className={`shrink-0 bg-[#F7F3ED] object-cover ${className}`}
    />
  );
}
