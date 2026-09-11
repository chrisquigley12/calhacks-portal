import { PageContainer } from "@/components/layout/page-container";
import { SectionHeader } from "@/components/layout/section-header";

const STEPS = [
  {
    title: "Create an account",
    description:
      "Sign up with your email and choose whether you're applying as a hacker or a volunteer.",
  },
  {
    title: "Submit your application",
    description:
      "Answer a short set of questions tailored to your role. You can come back to check on it any time.",
  },
  {
    title: "Track your status",
    description:
      "Organizers review each application and update its status. Your dashboard shows where things stand.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-b bg-muted/40">
      <PageContainer className="flex flex-col gap-12 py-20">
        <SectionHeader
          eyebrow="How it works"
          title="Three steps from sign-up to decision"
        />
        <ol className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3">
              <span className="flex size-8 items-center justify-center rounded-full border bg-background text-sm font-semibold">
                {index + 1}
              </span>
              <h3 className="text-base font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </PageContainer>
    </section>
  );
}
