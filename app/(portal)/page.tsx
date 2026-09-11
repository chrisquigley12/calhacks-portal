import { ApplicationTypeCard } from "@/components/landing/application-type-card";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { OrganizerCallout } from "@/components/landing/organizer-callout";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";
import { APPLICATION_TYPES } from "@/lib/application-types";

export default function LandingPage() {
  return (
    <>
      <Hero />

      <section className="border-b">
        <PageContainer className="flex flex-col gap-12 py-20">
          <SectionHeader
            eyebrow="Ways to participate"
            title="Choose how you'd like to take part"
            description="Each role has its own short application. Pick the one that fits and we'll tailor the questions."
          />
          <div className="grid gap-6 sm:grid-cols-2">
            {APPLICATION_TYPES.map((type) => (
              <ApplicationTypeCard key={type.value} type={type} />
            ))}
          </div>
        </PageContainer>
      </section>

      <HowItWorks />
      <OrganizerCallout />
    </>
  );
}
