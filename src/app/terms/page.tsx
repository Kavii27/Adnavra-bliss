import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getServerT();
  return {
    title: t("legal.terms.metaTitle"),
    description: t("legal.terms.metaDesc"),
  };
}

export default async function TermsPage() {
  const t = await getServerT();
  return (
    <main className="min-h-screen bg-[#faf6ef]">
      <HomeHeader />
      <section className="max-w-[800px] mx-auto px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight text-[#3a2f22]">{t("legal.terms.title")}</h1>
        {/* TODO: replace with reviewed legal copy before launch */}
        <p className="mt-2 text-xs text-[#a89880]">
          {t("legal.terms.note")}
        </p>
        <div className="mt-6 space-y-4 text-[#475467] leading-relaxed">
          <p>
            {t("legal.terms.intro")}
          </p>
          <h2 className="text-lg font-semibold text-[#3a2f22] mt-8">{t("legal.terms.h1")}</h2>
          <p>
            {t("legal.terms.p1")}
          </p>
          <h2 className="text-lg font-semibold text-[#3a2f22] mt-8">{t("legal.terms.h2")}</h2>
          <p>
            {t("legal.terms.p2")}
          </p>
          <h2 className="text-lg font-semibold text-[#3a2f22] mt-8">{t("legal.terms.h3")}</h2>
          <p>
            {t("legal.terms.p3")}
          </p>
          <h2 className="text-lg font-semibold text-[#3a2f22] mt-8">{t("legal.terms.h4")}</h2>
          <p>
            {t("legal.terms.p4")}
          </p>
          <h2 className="text-lg font-semibold text-[#3a2f22] mt-8">{t("legal.terms.h5")}</h2>
          <p>
            {t("legal.terms.contactPrefix")}{" "}
            <a href="mailto:hello@adnavra.lk" className="text-[#2A1D12] hover:underline">
              hello@adnavra.lk
            </a>
            .
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

