import { DescriptionList } from "@/components/ui/description-list";
import type { AnswerValues, FieldDefinition, FormDefinition } from "@/lib/applications/forms";

interface ApplicationResponsesProps {
  form: FormDefinition;
  answers: AnswerValues;
}

/** Labels each stored answer with its question, resolving option labels. */
export function ApplicationResponses({ form, answers }: ApplicationResponsesProps) {
  const items = form.fields.map((field) => ({
    label: field.label,
    value: formatAnswer(answers[field.name], field),
  }));

  return <DescriptionList items={items} />;
}

export function formatAnswer(value: string | string[] | undefined, field: FieldDefinition) {
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    if (field.kind === "checkboxes") {
      return value
        .map((item) => field.options.find((option) => option.value === item)?.label ?? item)
        .join(", ");
    }
    return value.join(", ");
  }

  if (!value) return "—";

  if (field.kind === "select") {
    return field.options.find((option) => option.value === value)?.label ?? value;
  }

  return <span className="whitespace-pre-wrap">{value}</span>;
}
