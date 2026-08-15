import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const toNumber = (v: string): number | undefined => {
  if (v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

export function NumberField({
  label,
  required,
  min,
  max,
  step = 1,
  value,
  onChange,
  invalid,
  className,
}: {
  label: string;
  required?: boolean;
  min: number;
  max: number;
  step?: number;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  className?: string;
}) {
  const displayValue = value === "" ? String(min) : value;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex items-center gap-3">
        <Slider
          className="flex-1"
          min={min}
          max={max}
          step={step}
          value={toNumber(displayValue) ?? min}
          onValueChange={(v) => onChange(String(v))}
        />
        <Input
          type="number"
          className="w-20 text-center"
          min={min}
          max={max}
          value={displayValue}
          onChange={(e) => onChange(e.target.value === "" ? String(min) : e.target.value)}
          onWheel={(e) => e.currentTarget.blur()}
          aria-invalid={invalid}
        />
      </div>
    </div>
  );
}
