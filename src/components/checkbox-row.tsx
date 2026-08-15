import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

export function CheckboxRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <FieldGroup>
      <Field orientation="horizontal">
        <Checkbox
          id={id}
          name={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
        />
        <FieldContent>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          {description && <FieldDescription>{description}</FieldDescription>}
        </FieldContent>
      </Field>
    </FieldGroup>
  );
}
