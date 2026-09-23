import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    id: "STARTER",
    name: "Starter",
    price: "LKR 3,000",
    popular: false,
    features: [
      "Dedicated salon profile and page",
      "Logo, photos and business info",
      "Services and pricing listing",
      "Online appointment booking",
      "Appointment management dashboard",
      "Customer booking details",
      "Unique salon URL and QR code",
      "Basic availability management",
      "Mobile-friendly booking page",
      "Basic technical support",
    ],
  },
  {
    id: "PROFESSIONAL",
    name: "Professional",
    price: "LKR 5,000",
    popular: true,
    features: [
      "Everything in Starter, plus:",
      "Staff and team management",
      "Multiple staff members",
      "Staff-specific appointments",
      "Customer database and booking history",
      "Advanced schedule management",
      "Appointment status management",
      "Basic business analytics",
      "Promotional offers",
      "Featured salon profile",
      "Priority support",
    ],
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: "LKR 7,000",
    popular: false,
    features: [
      "Everything in Professional, plus:",
      "Multiple branches and locations",
      "Advanced analytics and reports",
      "Booking and revenue insights",
      "Advanced customer management",
      "Loyalty and return-customer features",
      "Promotional campaigns",
      "Featured marketplace placement",
      "Advanced staff management",
      "Premium QR materials",
      "Priority technical support",
    ],
  },
];

export function PricingSection() {
  return (
    <div>
      <h2 className="text-3xl font-semibold tracking-tight text-[#3a2f22] text-center">Subscription plans</h2>
      <p className="mt-2 text-center text-[#475467] max-w-2xl mx-auto">
        Software that grows with your business. Choose the plan that fits today. Every plan can be
        upgraded as you grow.
      </p>

      <div className="mt-10 grid md:grid-cols-3 gap-6 items-start">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl border p-8 bg-white ${plan.popular ? "border-[#8a6d4f] shadow-[0_8px_30px_rgba(38,65,143,0.15)] relative" : "border-[#E3E8F0]"}`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-8 rounded-full brand-gradient-bg text-white text-xs font-semibold px-3 py-1">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-semibold text-[#3a2f22]">{plan.name}</h3>
            <p className="mt-2 text-3xl font-semibold text-[#3a2f22]">
              {plan.price}
              <span className="text-sm font-normal text-[#a89880]"> / month</span>
            </p>
            <ul className="mt-6 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-[#475467]">
                  <Check className="h-4 w-4 text-[#c9a26d] mt-0.5 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block mt-8">
              <Button variant={plan.popular ? "gradient" : "secondary"} className="w-full">
                Choose {plan.name}
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {/* One-time setup */}
      <div className="mt-8 rounded-2xl border border-[#E3E8F0] bg-[#EAF3F2] p-8 flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-[#3a2f22]">One-time setup fee: LKR 15,000</p>
          <p className="mt-1 text-sm text-[#475467] max-w-xl">
            Covers full onboarding: business profile setup, logo and image upload, service and pricing
            configuration, business hours, QR code generation, dashboard setup, and basic training.
            Charged once, at onboarding, on top of your chosen monthly plan.
          </p>
        </div>
      </div>

      {/* Detailed explanation below the cards, per plan */}
      <div className="mt-12 grid md:grid-cols-3 gap-8 text-sm text-[#475467]">
        <div>
          <p className="font-semibold text-[#3a2f22]">Starter, for independent owners</p>
          <p className="mt-2 leading-relaxed">
            Built for a single practitioner or a small salon that needs a professional booking page and a
            simple dashboard without staff management. Includes everything needed to stop taking bookings
            over the phone: an online page, a QR code, and appointment tracking.
          </p>
        </div>
        <div>
          <p className="font-semibold text-[#3a2f22]">Professional, for growing teams</p>
          <p className="mt-2 leading-relaxed">
            ADNAVRA&apos;s most popular plan. Adds staff scheduling, a full customer database with booking
            history, and featured placement in the marketplace as it grows, at a price that stays
            accessible for small teams of two to ten people.
          </p>
        </div>
        <div>
          <p className="font-semibold text-[#3a2f22]">Premium, for multi-location businesses</p>
          <p className="mt-2 leading-relaxed">
            For salons expanding beyond one branch. Adds multi-location management, advanced revenue
            reporting, loyalty tools for return customers, and top placement in marketplace search
            results.
          </p>
        </div>
      </div>
    </div>
  );
}
