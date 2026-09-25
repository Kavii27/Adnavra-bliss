import { notFound } from "next/navigation";
import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { VenueGrid } from "@/components/customer/home/venue-grid";
import { fetchVenuesByCategory } from "@/lib/marketplace-venues";
import { BUSINESS_TYPES, getCategoryLabel } from "@/lib/categories";

export function generateStaticParams() {
  return BUSINESS_TYPES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const label = getCategoryLabel(slug);
  return {
    title: `${label} salons | ADNAVRA BLISS`,
    description: `Browse every ${label} salon on ADNAVRA BLISS.`,
  };
}

export default async function SalonTypePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!BUSINESS_TYPES.some((t) => t.slug === slug)) notFound();
  const label = getCategoryLabel(slug);
  const businesses = await fetchVenuesByCategory(slug);
  return (
    <main className="relative min-h-screen bg-[#FDF9F3]">
      <HomeHeader />
      <section className="px-6 lg:px-12 pt-10 pb-16 max-w-[1400px] mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2A1D12]">Salon type</p>
        <h1 className="mt-1 text-2xl lg:text-3xl font-semibold tracking-tight text-[#1F1E1D]">{label}</h1>
        <p className="mt-2 text-sm text-[#8A8377]">{businesses.length} {businesses.length === 1 ? "salon" : "salons"}.</p>
        <div className="mt-8"><VenueGrid businesses={businesses} emptyText={`No ${label} salons yet.`} /></div>
      </section>
      <SiteFooter />
    </main>
  );
}
