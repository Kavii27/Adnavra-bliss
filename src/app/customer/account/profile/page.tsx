import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/customer/account/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  const userId = (session?.user as unknown as { id: string }).id;
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, phone: true, image: true },
  });

  if (!user) {
    return <p className="text-sm text-[#a89880]">Unable to load profile.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[#3a2f22]">Profile</h1>
        <p className="mt-1 text-sm text-[#a89880]">Update your personal details.</p>
      </div>
      <div className="rounded-xl border border-[#E3E8F0] bg-white p-6">
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
  );
}
