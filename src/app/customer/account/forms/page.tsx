import { ClipboardList } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";

const SERIF = "font-[family-name:var(--font-display)]";

export default async function FormsPage() {
  const t = await getServerT();
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#9A7B4F" }}>
          {t("account.yourAccount")}
        </p>
        <h1 className={`${SERIF} mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]`}>{t("account.forms")}</h1>
        <p className="mt-1.5 text-sm text-[#8A8377]">{t("account.formsSub")}</p>
      </div>
      <div className="rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-12 text-center">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "linear-gradient(135deg, #D9BE8C, #C9A467)" }}
        >
          <ClipboardList className="h-6 w-6 text-[#1B1714]" />
        </div>
        <p className={`${SERIF} mt-5 text-xl font-semibold text-[#1F1B17]`}>{t("account.noForms")}</p>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-[#8A8377]">
          {t("account.noFormsSub")}
        </p>
      </div>
    </div>
  );
}
