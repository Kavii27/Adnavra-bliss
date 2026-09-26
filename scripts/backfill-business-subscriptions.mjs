import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const defaultPlan = await db.subscriptionPlan.findFirst({
    where: { isActive: true },
    orderBy: { rank: "asc" },
  });
  if (!defaultPlan) {
    console.error("No active subscription plan found — create one on /admin/subscription-plans first.");
    process.exit(1);
  }

  const missing = await db.business.findMany({
    where: { businessSubscription: null },
    select: { id: true, name: true },
  });

  for (const b of missing) {
    await db.businessSubscription.create({
      data: { businessId: b.id, planId: defaultPlan.id, status: "ACTIVE" },
    });
    console.log(`Assigned ${defaultPlan.name} to ${b.name}`);
  }

  console.log(`Done. ${missing.length} salon(s) updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
