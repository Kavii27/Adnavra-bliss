"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { StepBusinessName } from "@/components/onboarding/step-business-name";
import { StepCategories } from "@/components/onboarding/step-categories";
import { StepTeamSize } from "@/components/onboarding/step-team-size";
import { StepLocationType } from "@/components/onboarding/step-location-type";
import { StepLocationMap, type LocationFields } from "@/components/onboarding/step-location-map";

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState("");
  const [locationType, setLocationType] = useState("PHYSICAL");
  const [location, setLocation] = useState<LocationFields>({
    address: "",
    district: "",
    city: "",
    county: "",
    state: "",
    postcode: "",
    directions: "",
    latitude: 6.9271,
    longitude: 79.8612,
  });

  function toggleCategory(id: string) {
    setCategories((cur) =>
      cur.includes(id) ? cur.filter((c) => c !== id) : cur.length < 4 ? [...cur, id] : cur
    );
  }

  function slugify(v: string) {
    return (
      v
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50) || "salon"
    );
  }

  async function handleFinish() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slugify(name),
          website: website || undefined,
          categories,
          teamSize,
          locationType,
          address: location.address || undefined,
          district: location.district || undefined,
          city: location.city || undefined,
          county: location.county || undefined,
          state: location.state || undefined,
          postcode: location.postcode || undefined,
          directions: location.directions || undefined,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not create business");
      // Push the fresh businessId into the JWT before navigating, so the dashboard
      // layout's guardrail (and every other page that reads session.user.businessId) sees it
      // immediately instead of on next login.
      await update({ businessId: json.data.id });
      router.push("/dashboard/qr-code");
      router.refresh();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (step === 1) {
    return (
      <WizardShell
        step={1}
        totalSteps={TOTAL_STEPS}
        title="What's your business name?"
        subtitle="This is the brand name your clients will see. Your billing and legal name can be added later."
        onNext={() => setStep(2)}
        nextDisabled={!name.trim()}
      >
        <StepBusinessName name={name} website={website} onChangeName={setName} onChangeWebsite={setWebsite} />
      </WizardShell>
    );
  }
  if (step === 2) {
    return (
      <WizardShell
        step={2}
        totalSteps={TOTAL_STEPS}
        title="Select categories that best describe your business"
        subtitle="Choose your primary and up to three related service types."
        onBack={() => setStep(1)}
        onNext={() => setStep(3)}
        nextDisabled={categories.length === 0}
      >
        <StepCategories selected={categories} onToggle={toggleCategory} />
      </WizardShell>
    );
  }
  if (step === 3) {
    return (
      <WizardShell
        step={3}
        totalSteps={TOTAL_STEPS}
        title="What's your team size?"
        subtitle="This will help us set up your calendar correctly."
        onBack={() => setStep(2)}
        onNext={() => setStep(4)}
        nextDisabled={!teamSize}
      >
        <StepTeamSize value={teamSize} onChange={setTeamSize} />
      </WizardShell>
    );
  }
  if (step === 4) {
    return (
      <WizardShell
        step={4}
        totalSteps={TOTAL_STEPS}
        title="Where do you provide your services?"
        onBack={() => setStep(3)}
        onNext={() => setStep(5)}
      >
        <StepLocationType value={locationType} onChange={setLocationType} />
      </WizardShell>
    );
  }
  return (
    <WizardShell
      step={5}
      totalSteps={TOTAL_STEPS}
      title="Set your venue's physical location"
      subtitle="Add your primary business location so your clients can easily find you."
      onBack={() => setStep(4)}
      onNext={handleFinish}
      nextLabel={saving ? "Saving..." : "Finish"}
      nextDisabled={saving}
    >
      <StepLocationMap value={location} onChange={setLocation} />
      {error && <p className="mt-4 text-sm text-[#F87171]">{error}</p>}
    </WizardShell>
  );
}
