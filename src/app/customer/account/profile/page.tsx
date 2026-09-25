import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/customer/account/profile-form";
import { getServerT } from "@/lib/i18n/server";

const SERIF = "font-[family-name:var(--font-display)]";

export default async function ProfilePage() {
  const t = await getServerT();
  const session = await auth();
  const userId = (session?.user as unknown as { id: string } | undefined)?.id;
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, phone: true, image: true },
  });

  if (!user) {
    return <p className="text-sm text-[#8A8377]">{t("account.profileLoadErr")}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#9A7B4F" }}>
          {t("account.yourAccount")}
        </p>
        <h1 className={`${SERIF} mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]`}>{t("account.profile")}</h1>
        <p className="mt-1.5 text-sm text-[#8A8377]">{t("account.profileSub")}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_6px_24px_rgba(120,88,49,0.08)]">
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #C9A467, #8A6D4F)" }} />
        <div className="p-6 sm:p-8">
          <ProfileForm
            initial={{
              name: user.name ?? "",
              email: user.email ?? "",
              phone: user.phone ?? "",
              image: user.image ?? "",
            }}
          />
        </div>
      </div>
    </div>
  );
}
