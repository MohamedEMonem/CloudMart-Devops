"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductGallery({
  images,
  productName,
}: {
  images: string[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
        <Image
          src={images[activeIndex]}
          alt={`${productName} — image ${activeIndex + 1} of ${images.length}`}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3" role="tablist" aria-label="Product images">
          {images.map((src, i) => (
            <button
              key={src}
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`View image ${i + 1}`}
              onClick={() => setActiveIndex(i)}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                i === activeIndex
                  ? "border-accent-400"
                  : "border-transparent hover:border-neutral-700"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
