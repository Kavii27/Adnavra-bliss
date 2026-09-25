import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getServerT();
  return {
    title: t("help.metaTitle"),
    description: t("help.metaDesc"),
  };
}

export default async function HelpPage() {
  const t = await getServerT();
  return (
    <main className="min-h-screen bg-[#FDF9F3]">
      <SiteHeader />
      <section className="max-w-[800px] mx-auto px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight text-[#1F1E1D]">{t("help.title")}</h1>
        <p className="mt-4 text-[#4A4640] leading-relaxed">
          {t("help.sub")}
        </p>

        <div className="mt-10 space-y-6">
          <div className="rounded-lg border border-[#E5DDD0] bg-white p-6">
            <h2 className="text-base font-semibold text-[#1F1E1D]">{t("help.q1")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#4A4640]">
              {t("help.a1")}
            </p>
          </div>

          <div className="rounded-lg border border-[#E5DDD0] bg-white p-6">
            <h2 className="text-base font-semibold text-[#1F1E1D]">{t("help.q2")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#4A4640]">
              {t("help.a2")}
            </p>
          </div>

          <div className="rounded-lg border border-[#E5DDD0] bg-white p-6">
            <h2 className="text-base font-semibold text-[#1F1E1D]">{t("help.q3")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#4A4640]">
              {t("help.a3")}
            </p>
          </div>

          <div className="rounded-lg border border-[#E5DDD0] bg-white p-6">
            <h2 className="text-base font-semibold text-[#1F1E1D]">{t("help.q4")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#4A4640]">
              {t("help.a4")}
            </p>
          </div>

          <div className="rounded-lg border border-[#E5DDD0] bg-white p-6">
            <p className="text-sm font-medium text-[#1F1E1D]">{t("help.still")}</p>
            <p className="mt-1 text-sm text-[#4A4640]">
              {t("help.stillPrefix")}{" "}
              <a href="mailto:hello@adnavra.lk" className="text-[#795831] hover:underline">
                hello@adnavra.lk
              </a>{" "}
              {t("help.stillSuffix")}
            </p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
