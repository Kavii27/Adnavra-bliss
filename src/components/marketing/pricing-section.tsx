import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerT } from "@/lib/i18n/server";

const PLANS = [
  {
    id: "STARTER",
    nameKey: "mkt.pricing.starter.name",
    price: "LKR 3,000",
    popular: false,
    featureKeys: [
      "mkt.pricing.starter.f1",
      "mkt.pricing.starter.f2",
      "mkt.pricing.starter.f3",
      "mkt.pricing.starter.f4",
      "mkt.pricing.starter.f5",
      "mkt.pricing.starter.f6",
      "mkt.pricing.starter.f7",
      "mkt.pricing.starter.f8",
      "mkt.pricing.starter.f9",
      "mkt.pricing.starter.f10",
    ],
  },
  {
    id: "PROFESSIONAL",
    nameKey: "mkt.pricing.pro.name",
    price: "LKR 5,000",
    popular: true,
    featureKeys: [
      "mkt.pricing.pro.f1",
      "mkt.pricing.pro.f2",
      "mkt.pricing.pro.f3",
      "mkt.pricing.pro.f4",
      "mkt.pricing.pro.f5",
      "mkt.pricing.pro.f6",
      "mkt.pricing.pro.f7",
      "mkt.pricing.pro.f8",
      "mkt.pricing.pro.f9",
      "mkt.pricing.pro.f10",
      "mkt.pricing.pro.f11",
    ],
  },
  {
    id: "PREMIUM",
    nameKey: "mkt.pricing.premium.name",
    price: "LKR 7,000",
    popular: false,
    featureKeys: [
      "mkt.pricing.premium.f1",
      "mkt.pricing.premium.f2",
      "mkt.pricing.premium.f3",
      "mkt.pricing.premium.f4",
      "mkt.pricing.premium.f5",
      "mkt.pricing.premium.f6",
      "mkt.pricing.premium.f7",
      "mkt.pricing.premium.f8",
      "mkt.pricing.premium.f9",
      "mkt.pricing.premium.f10",
      "mkt.pricing.premium.f11",
    ],
  },
];

export async function PricingSection() {
  const t = await getServerT();
  return (
    <div>
      <h2 className="text-3xl font-semibold tracking-tight text-[#3a2f22] text-center">{t("mkt.pricing.title")}</h2>
      <p className="mt-2 text-center text-[#475467] max-w-2xl mx-auto">
        {t("mkt.pricing.sub")}
      </p>

      <div className="mt-10 grid md:grid-cols-3 gap-6 items-start">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl border p-8 bg-white ${plan.popular ? "border-[#8a6d4f] shadow-[0_8px_30px_rgba(38,65,143,0.15)] relative" : "border-[#E3E8F0]"}`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-8 rounded-full brand-gradient-bg text-white text-xs font-semibold px-3 py-1">
                {t("mkt.pricing.popular")}
              </span>
            )}
            <h3 className="text-lg font-semibold text-[#3a2f22]">{t(plan.nameKey)}</h3>
            <p className="mt-2 text-3xl font-semibold text-[#3a2f22]">
              {plan.price}
              <span className="text-sm font-normal text-[#a89880]"> {t("mkt.pricing.perMonth")}</span>
            </p>
            <ul className="mt-6 space-y-2.5">
              {plan.featureKeys.map((fk) => (
                <li key={fk} className="flex items-start gap-2 text-sm text-[#475467]">
                  <Check className="h-4 w-4 text-[#c9a26d] mt-0.5 shrink-0" /> {t(fk)}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block mt-8">
              <Button variant={plan.popular ? "gradient" : "secondary"} className="w-full">
                {t("mkt.pricing.choose")} {t(plan.nameKey)}
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {/* One-time setup */}
      <div className="mt-8 rounded-2xl border border-[#E3E8F0] bg-[#EAF3F2] p-8 flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-[#3a2f22]">{t("mkt.pricing.setupTitle")}</p>
          <p className="mt-1 text-sm text-[#475467] max-w-xl">
            {t("mkt.pricing.setupDesc")}
          </p>
        </div>
      </div>

      {/* Detailed explanation below the cards, per plan */}
      <div className="mt-12 grid md:grid-cols-3 gap-8 text-sm text-[#475467]">
        <div>
          <p className="font-semibold text-[#3a2f22]">{t("mkt.pricing.starterHeading")}</p>
          <p className="mt-2 leading-relaxed">
            {t("mkt.pricing.starterDesc")}
          </p>
        </div>
        <div>
          <p className="font-semibold text-[#3a2f22]">{t("mkt.pricing.proHeading")}</p>
          <p className="mt-2 leading-relaxed">
            {t("mkt.pricing.proDesc")}
          </p>
        </div>
        <div>
          <p className="font-semibold text-[#3a2f22]">{t("mkt.pricing.premiumHeading")}</p>
          <p className="mt-2 leading-relaxed">
            {t("mkt.pricing.premiumDesc")}
          </p>
        </div>
      </div>
    </div>
  );
}
