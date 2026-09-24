import { ChangePasswordForm, DeactivateAccount } from "@/components/customer/account/settings-forms";

const SERIF = "font-[family-name:var(--font-display)]";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#9A7B4F" }}>
          Your account
        </p>
        <h1 className={`${SERIF} mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]`}>Settings</h1>
        <p className="mt-1.5 text-sm text-[#8A8377]">Manage your account security.</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_6px_24px_rgba(120,88,49,0.08)]">
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #C9A467, #8A6D4F)" }} />
        <div className="p-6 sm:p-8">
          <h2 className={`${SERIF} text-xl font-semibold text-[#1F1B17]`}>Change password</h2>
          <p className="mt-1 text-xs text-[#8A8377]">Your password must be at least 8 characters.</p>
          <div className="mt-5 max-w-lg">
            <ChangePasswordForm />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#F1D4D4] bg-white shadow-[0_6px_24px_rgba(185,28,28,0.06)]">
        <div className="h-1.5 w-full bg-[#B91C1C]" />
        <div className="p-6 sm:p-8">
          <h2 className={`${SERIF} text-xl font-semibold text-[#B91C1C]`}>Deactivate account</h2>
          <div className="mt-4 max-w-lg">
            <DeactivateAccount />
          </div>
        </div>
      </section>
    </div>
  );
}
