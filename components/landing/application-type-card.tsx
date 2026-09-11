import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplicationTypeDefinition } from "@/lib/application-types";

interface ApplicationTypeCardProps {
  type: ApplicationTypeDefinition;
}

/**
 * Explains one way to participate and links to sign-up with that type
 * preselected via a query parameter. Sign-up ignores the parameter for now;
 * the account-type step in a later phase reads it to prefill the choice.
 */
export function ApplicationTypeCard({ type }: ApplicationTypeCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">{type.label}</CardTitle>
        <CardDescription>{type.summary}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            The application asks about
          </p>
          <ul className="flex flex-col gap-2 text-sm">
            {type.highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-2">
                <Check
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link
          href={`/auth/sign-up?type=${type.value}`}
          className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Apply as a {type.label.toLowerCase()}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
