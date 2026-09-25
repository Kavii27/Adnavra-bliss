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
        {/* Mobile: natural aspect ratio, uncropped (banner.jpg is 2752x1420).
            Tablet/desktop: cropped banner strip. */}
        <Image
          src={imageUrl}
          alt={alt}
          width={2752}
          height={1420}
          priority
          sizes="100vw"
          className="h-auto w-full sm:hidden"
        />
        <div className="relative hidden w-full bg-[#F1E9DC] sm:block sm:aspect-[17/9] lg:aspect-[14/3]">
          <Image src={imageUrl} alt={alt} fill priority className="object-cover [object-position:center_calc(50%+10px)]" sizes="100vw" />
        </div>
      </Link>
    </section>
  );
}
