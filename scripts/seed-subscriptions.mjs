/**
 * Seed data for the subscription / boosting / advertising system.
 * Safe to re-run — everything is upserted by a stable key.
 *
 * Usage: npm run seed:subscriptions
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const PLANS = [
  {
    key: "silver",
    name: "Silver",
    rank: 1,
    boostsPerWeek: 0,
    maxBoostHours: 0,
    galleryLimit: 6,
    serviceLimit: 15,
    searchWeight: 1,
    isFeaturedEligible: false,
    isPriorityEligible: false,
    description: "Basic marketplace listing with normal search visibility.",
  },
  {
    key: "gold",
    name: "Gold",
    rank: 2,
    boostsPerWeek: 5,
    maxBoostHours: 24,
    galleryLimit: 20,
    serviceLimit: 40,
    searchWeight: 2,
    isFeaturedEligible: true,
    isPriorityEligible: false,
    description: "Higher search visibility, featured placement, more capacity.",
  },
  {
    key: "platinum",
    name: "Platinum",
    rank: 3,
    boostsPerWeek: 15,
    maxBoostHours: 24,
    galleryLimit: 50,
    serviceLimit: 100,
    searchWeight: 3,
    isFeaturedEligible: true,
    isPriorityEligible: true,
    description: "Highest visibility, priority placement, homepage exposure.",
  },
];

const PLACEMENTS = [
  { key: "homepage_top", name: "Homepage Top Banner", maxActiveAds: 3 },
  { key: "homepage_middle", name: "Homepage Middle Banner", maxActiveAds: 2 },
  { key: "search_results", name: "Search Results Banner", maxActiveAds: 2 },
  { key: "category_page", name: "Category Page Banner", maxActiveAds: 2 },
  { key: "city_page", name: "City Page Banner", maxActiveAds: 2 },
  { key: "salon_profile", name: "Salon Profile Page Banner", maxActiveAds: 1 },
  { key: "booking_page", name: "Booking Page Banner", maxActiveAds: 1 },
];

// All clustered within ~3km of each other (central Colombo) so a normal
// search radius shows every plan tier ranked together in one result list —
// makes the ranking order actually visible on /customer/search, not just
// in raw JSON.
const DEMO_BUSINESSES = [
  { slug: "demo-silver-salon", name: "Demo Silver Salon", city: "Colombo", planKey: "silver", latitude: 6.9271, longitude: 79.8612 },
  { slug: "demo-gold-salon", name: "Demo Gold Salon", city: "Colombo", planKey: "gold", latitude: 6.9159, longitude: 79.8562 },
  { slug: "demo-platinum-salon", name: "Demo Platinum Salon", city: "Colombo", planKey: "platinum", latitude: 6.9344, longitude: 79.8428 },
  // No subscription at all — should still appear in results (planRank 0), just ranked last.
  { slug: "demo-unsubscribed-salon", name: "Demo Unsubscribed Salon", city: "Colombo", planKey: null, latitude: 6.9019, longitude: 79.8695 },
];

async function main() {
  const plans = {};
  for (const p of PLANS) {
    plans[p.key] = await db.subscriptionPlan.upsert({
      where: { key: p.key },
      update: p,
      create: p,
    });
  }
  console.log(`Upserted ${Object.keys(plans).length} subscription plans.`);

  const placements = {};
  for (const p of PLACEMENTS) {
    placements[p.key] = await db.advertisementPlacement.upsert({
      where: { key: p.key },
      update: p,
      create: p,
    });
  }
  console.log(`Upserted ${Object.keys(placements).length} advertisement placements.`);

  for (const biz of DEMO_BUSINESSES) {
    const business = await db.business.upsert({
      where: { slug: biz.slug },
      update: { name: biz.name, city: biz.city, latitude: biz.latitude, longitude: biz.longitude },
      create: {
        slug: biz.slug,
        name: biz.name,
        city: biz.city,
        categories: ["hair-styling"],
        latitude: biz.latitude,
        longitude: biz.longitude,
      },
    });

    if (!biz.planKey) continue; // no subscription on purpose — tests the "planRank 0" case

    await db.businessSubscription.upsert({
      where: { businessId: business.id },
      update: { planId: plans[biz.planKey].id, status: "ACTIVE" },
      create: {
        businessId: business.id,
        planId: plans[biz.planKey].id,
        status: "ACTIVE",
        startDate: new Date(),
      },
    });

    const plan = plans[biz.planKey];
    if (plan.boostsPerWeek > 0) {
      const existingBoost = await db.salonBoost.findFirst({
        where: { businessId: business.id, cancelledAt: null, endAt: { gt: new Date() } },
      });
      if (!existingBoost) {
        await db.salonBoost.create({
          data: {
            businessId: business.id,
            source: "AUTO",
            startAt: new Date(),
            endAt: new Date(Date.now() + plan.maxBoostHours * 60 * 60 * 1000),
          },
        });
      }
    }
  }
  console.log(`Upserted ${DEMO_BUSINESSES.length} demo businesses with subscriptions/boosts.`);

  const homepageTop = placements["homepage_top"];
  const demoAds = [
    {
      title: "Spring Haircare Sale",
      imageUrl: "/grow.jpeg",
      destinationUrl: "https://example.com/promo/spring-haircare",
      priority: 10,
    },
    {
      title: "New Salons in Kandy",
      imageUrl: "/serve.jpeg",
      destinationUrl: "https://example.com/promo/kandy-salons",
      priority: 5,
    },
  ];
  for (const ad of demoAds) {
    const found = await db.advertisement.findFirst({ where: { title: ad.title } });
    if (found) {
      await db.advertisement.update({ where: { id: found.id }, data: { imageUrl: ad.imageUrl } });
    } else {
      await db.advertisement.create({
        data: {
          ...ad,
          placementId: homepageTop.id,
          startAt: new Date(),
          endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.log(`Ensured ${demoAds.length} demo advertisements in homepage_top.`);

  const defaultWeights = {
    planWeight: 10,
    boostBonus: 50,
    featuredBonus: 20,
    priorityBonus: 40,
    distanceWeight: 1,
  };
  await db.platformSetting.upsert({
    where: { key: "ranking_weights" },
    update: {},
    create: { key: "ranking_weights", value: defaultWeights },
  });
  console.log("Ensured default ranking_weights platform setting.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
