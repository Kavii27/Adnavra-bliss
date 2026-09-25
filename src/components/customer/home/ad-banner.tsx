import Image from "next/image";
import Link from "next/link";

export function AdBanner({
  imageUrl = "/banner.jpg",
  href = "/for-business",
  alt = "ADNAVRA BLISS promotion",
}: {
  imageUrl?: string | null;
  href?: string;
  alt?: string;
}) {
  if (!imageUrl) return null;
  return (
    <section className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6 lg:px-12">
      <Link
        href={href}
        className="block overflow-hidden rounded-xl border border-[#E5DDD0] shadow-[0_4px_16px_rgba(31,30,29,0.08)] sm:rounded-2xl"
      >
        {/* CarMarket's banner is ~1800x420 (≈4.3:1) on desktop; on mobile it
            needs a taller crop (≈2:1) or the text inside the banner image
            becomes unreadable — request 2 image sizes from whoever designs
            banner.jpg, or crop with object-position as done below. */}
        <div className="relative aspect-[2/1] w-full bg-[#F1E9DC] sm:aspect-[16/9] lg:aspect-[21/5]">
          <Image src={imageUrl} alt={alt} fill priority className="object-cover" sizes="100vw" />
        </div>
      </Link>
    </section>
  );
}
