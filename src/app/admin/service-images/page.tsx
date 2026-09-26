import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ServiceImageManager } from "@/components/admin/service-image-manager";

export default async function AdminServiceImagesPage() {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin/service-images");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-[#3a2f22]">Treatment photos</h1>
      <p className="mt-1 max-w-2xl text-sm text-[#a89880]">
        These photos are shown automatically on every salon&apos;s treatment cards, matched by the
        treatment&apos;s name — this is why many salons offering &ldquo;Haircut&rdquo; show the same photo. Upload a
        photo for a specific treatment to replace it everywhere that treatment appears, or replace a
        category&apos;s general photo to change the fallback used by any treatment that doesn&apos;t have its
        own specific photo yet.
      </p>
      <ServiceImageManager />
    </div>
  );
}
