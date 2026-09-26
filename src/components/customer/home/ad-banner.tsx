import Image from "next/image";
import Link from "next/link";
import { getServerT } from "@/lib/i18n/server";

export async function AdBanner({
  imageUrl = "/banner.jpg",
  href,
  alt,
}: {
  imageUrl?: string | null;
  href?: string | null;
  alt?: string;
}) {
  const t = await getServerT();
  const resolvedAlt = alt ?? t("venue.adAlt");
  if (!imageUrl) return null;

  const isExternal = Boolean(href && !href.startsWith("/"));
  const content = (
    <div className="block overflow-hidden rounded-xl border border-[#E5DDD0] shadow-[0_4px_16px_rgba(31,30,29,0.08)] sm:rounded-2xl">
      {/* Mobile: natural aspect ratio, uncropped (banner.jpg is 2752x1420).
          Tablet/desktop: cropped banner strip. */}
      <Image
        src={imageUrl}
        alt={resolvedAlt}
        width={2752}
        height={1420}
        priority
        sizes="100vw"
        className="h-auto w-full sm:hidden"
      />
      <div className="relative hidden w-full bg-[#F1E9DC] sm:block sm:aspect-[17/9] lg:aspect-[14/3]">
        <Image src={imageUrl} alt={resolvedAlt} fill priority className="object-cover [object-position:center_calc(50%+10px)]" sizes="100vw" />
      </div>
    </div>
  );

  return (
    <section className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6 lg:px-12">
      {href ? (
        isExternal ? (
          <a href={href} target="_blank" rel="noreferrer" aria-label={resolvedAlt}>
            {content}
          </a>
        ) : (
          <Link href={href} aria-label={resolvedAlt}>
            {content}
          </Link>
        )
      ) : (
        content
      )}
    </section>
  );
}
