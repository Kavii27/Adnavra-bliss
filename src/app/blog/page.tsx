import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getServerT();
  return {
    title: t("blog.metaTitle"),
    description: t("blog.metaDesc"),
  };
}

export default async function BlogPage() {
  const t = await getServerT();
  return (
    <main className="min-h-screen bg-[#FDF9F3]">
      <SiteHeader />
      <section className="max-w-[800px] mx-auto px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight text-[#1F1E1D]">{t("blog.title")}</h1>
        <p className="mt-4 text-[#4A4640] leading-relaxed">
          {t("blog.sub")}
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
