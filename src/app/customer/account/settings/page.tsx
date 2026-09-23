import { ChangePasswordForm, DeactivateAccount } from "@/components/customer/account/settings-forms";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[#3a2f22]">Settings</h1>
        <p className="mt-1 text-sm text-[#a89880]">Manage your account security.</p>
      </div>

      <section className="rounded-xl border border-[#E3E8F0] bg-white p-6">
        <h2 className="text-sm font-semibold text-[#3a2f22]">Change password</h2>
        <p className="mt-1 text-xs text-[#a89880]">Your password must be at least 8 characters.</p>
        <div className="mt-5 max-w-lg">
          <ChangePasswordForm />
        </div>
      </section>

      <section className="rounded-xl border border-[#E3E8F0] bg-white p-6">
        <h2 className="text-sm font-semibold text-[#B91C1C]">Deactivate account</h2>
        <div className="mt-4 max-w-lg">
          <DeactivateAccount />
        </div>
      </section>
    </div>
  );
}
