import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#FDF9F3]">
      <SiteHeader />
      <section className="max-w-[800px] mx-auto px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight text-[#1F1E1D]">Blog</h1>
        <p className="mt-4 text-[#4A4640] leading-relaxed">
          We are working on our first posts. Check back soon.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
