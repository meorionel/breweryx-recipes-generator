import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Beer,
  Check,
  Copy,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { EFFECTS, INSTANT_EFFECTS } from "./data/effects";
import { WOOD_OPTIONS } from "./data/constants";
import itemMap from "./data/item_map.json";
import {
  validateRecipe,
  generateRecipe,
  buildSummary,
  type IngredientInput,
  type Translate,
} from "./services/recipe.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckboxRow } from "@/components/checkbox-row";
import { NumberField } from "@/components/number-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type EffectState = {
  enabled: boolean;
  level: string;
  levelMin: string;
  levelMax: string;
  levelRange: boolean;
  duration: string;
  durationMin: string;
  durationMax: string;
  durationRange: boolean;
};
type EffectStates = Record<string, EffectState>;
type ItemOption = { cn: string; id: string };

const initialEffectStates = (): EffectStates =>
  Object.fromEntries(
    EFFECTS.map((e) => [
      e.id,
      {
        enabled: false,
        level: "",
        levelMin: "1",
        levelMax: "1",
        levelRange: false,
        duration: "",
        durationMin: "1",
        durationMax: "1",
        durationRange: false,
      },
    ])
  );

const num = (v: string): number | undefined => {
  const n = Number(v);
  return v === "" || Number.isNaN(n) ? undefined : n;
};

const str = (v: string): string | undefined => {
  const t = v.trim();
  return t === "" ? undefined : t;
};

const lines = (v: string): string[] =>
  v
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const parseColorText = (text: string): string => {
  let html = "";
  let color = "";
  let buffer = "";
  const flush = () => {
    if (!buffer) return;
    const escaped = escapeHtml(buffer);
    html += color ? `<span style="color:#${color}">${escaped}</span>` : escaped;
    buffer = "";
  };
  let i = 0;
  while (i < text.length) {
    if (text[i] === "&" && text[i + 1] === "#" && /^[0-9a-fA-F]{6}$/.test(text.slice(i + 2, i + 8))) {
      flush();
      color = text.slice(i + 2, i + 8);
      i += 8;
      continue;
    }
    if (text[i] === "&" && i + 1 < text.length) {
      i += 2;
      continue;
    }
    buffer += text[i];
    i++;
  }
  flush();
  return html;
};

const cnByItem = new Map(Object.entries(itemMap).map(([cn, id]) => [id, cn]));

const Required = () => <span className="text-destructive">*</span>;

const SectionTitle = ({ title, description }: { title: string; description?: string }) => (
  <div>
    <h3 className="text-sm font-semibold">{title}</h3>
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
  </div>
);

const Field = ({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("grid gap-1.5", className)}>
    <Label>
      {label} {required && <Required />}
    </Label>
    {children}
  </div>
);

export function RecipeForm() {
  const { t } = useTranslation();
  const translate: Translate = (key, vars) => t(key, vars);
  const [recipeKey, setRecipeKey] = useState("");
  const [quality, setQuality] = useState(false);
  const [nameBad, setNameBad] = useState("");
  const [nameNormal, setNameNormal] = useState("");
  const [nameGood, setNameGood] = useState("");
  const [loreCommon, setLoreCommon] = useState("");
  const [loreBad, setLoreBad] = useState("");
  const [loreNormal, setLoreNormal] = useState("");
  const [loreGood, setLoreGood] = useState("");
  const [drinkmessage, setDrinkmessage] = useState("");
  const [drinktitle, setDrinktitle] = useState("");
  const [serverCommands, setServerCommands] = useState("");
  const [playerCommands, setPlayerCommands] = useState("");
  const [cmdBad, setCmdBad] = useState("");
  const [cmdNormal, setCmdNormal] = useState("");
  const [cmdGood, setCmdGood] = useState("");
  const [cookingtime, setCookingtime] = useState("0");
  const [enableDistill, setEnableDistill] = useState(false);
  const [distillruns, setDistillruns] = useState("0");
  const [distilltime, setDistilltime] = useState("0");
  const [enableAge, setEnableAge] = useState(false);
  const [wood, setWood] = useState(0);
  const [age, setAge] = useState("0");
  const [color, setColor] = useState("");
  const [difficulty, setDifficulty] = useState("1");
  const [alcohol, setAlcohol] = useState("0");
  const [glint, setGlint] = useState(false);
  const [effects, setEffects] = useState<EffectStates>(initialEffectStates);

  const [selectedItem, setSelectedItem] = useState<ItemOption | null>(null);
  const [itemAmount, setItemAmount] = useState(1);
  const [ingredients, setIngredients] = useState<IngredientInput[]>([]);

  const [summary, setSummary] = useState<string[]>([]);
  const [yaml, setYaml] = useState("");
  const [copied, setCopied] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const itemOptions = useMemo<ItemOption[]>(
    () => Object.entries(itemMap).map(([cn, id]) => ({ cn, id })),
    []
  );

  const enabledEffects = EFFECTS.filter((e) => effects[e.id]?.enabled);

  const addIngredient = () => {
    if (!selectedItem) {
      toast.error(t("ingredients.selectFirst"));
      return;
    }
    if (Number.isNaN(itemAmount) || itemAmount <= 0) {
      toast.error(t("ingredients.amountInvalid"));
      return;
    }
    setIngredients((prev) => [...prev, { item: selectedItem.id, amount: itemAmount }]);
    setSelectedItem(null);
    setItemAmount(1);
    clearFieldError("ingredients");
  };

  const removeIngredient = (idx: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateEffect = (id: string, patch: Partial<EffectState>) => {
    setEffects((prev) => ({ ...prev, [id]: { ...prev[id]!, ...patch } }));
  };

  const toggleLevelRange = (id: string, range: boolean) => {
    const st = effects[id]!;
    if (range) {
      const current = st.level.trim() === "" ? "1" : st.level.trim();
      const parts = current.split("-");
      updateEffect(id, {
        levelRange: true,
        levelMin: parts[0]?.trim() || "1",
        levelMax: parts[1]?.trim() || parts[0]?.trim() || "1",
      });
    } else {
      const value = st.levelRange ? st.levelMax.trim() || st.levelMin : st.level;
      updateEffect(id, {
        levelRange: false,
        level: value.trim() === "" ? "1" : value.trim(),
      });
    }
  };

  const toggleDurationRange = (id: string, range: boolean) => {
    const st = effects[id]!;
    if (range) {
      const current = st.duration.trim() === "" ? "1" : st.duration.trim();
      const parts = current.split("-");
      updateEffect(id, {
        durationRange: true,
        durationMin: parts[0]?.trim() || "1",
        durationMax: parts[1]?.trim() || parts[0]?.trim() || "1",
      });
    } else {
      const value = st.durationRange
        ? st.durationMax.trim() || st.durationMin
        : st.duration;
      updateEffect(id, {
        durationRange: false,
        duration: value.trim() === "" ? "1" : value.trim(),
      });
    }
  };

  const setEffectEnabled = (id: string, enabled: boolean) => {
    setEffects((prev) => ({ ...prev, [id]: { ...prev[id]!, enabled } }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errs: Record<string, string> = {};
    if (!str(nameNormal)) errs.name = t("errors.name");
    if (quality && !str(nameBad)) errs.nameBad = t("errors.nameBad");
    if (quality && !str(nameGood)) errs.nameGood = t("errors.nameGood");
    if (num(cookingtime) === undefined) errs.cookingtime = t("errors.cookingtime");
    if (num(difficulty) === undefined) errs.difficulty = t("errors.difficulty");
    if (ingredients.length === 0) errs.ingredients = t("errors.ingredients");

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      toast.error(t("toast.filledRequired"), { description: Object.values(errs).join("\n") });
      return;
    }
    setFieldErrors({});

    const payload = {
      key: str(recipeKey),
      quality,
      name: quality
        ? [str(nameBad), str(nameNormal), str(nameGood)]
        : [str(nameNormal)],
      ingredients,
      cookingtime: num(cookingtime),
      distillruns: enableDistill ? num(distillruns) : undefined,
      distilltime: enableDistill ? num(distilltime) : undefined,
      wood: enableAge ? wood : undefined,
      age: enableAge ? num(age) : undefined,
      color: str(color),
      difficulty: num(difficulty),
      alcohol: num(alcohol),
      lore: quality
        ? {
            common: lines(loreCommon),
            bad: lines(loreBad),
            normal: lines(loreNormal),
            good: lines(loreGood),
          }
        : { common: lines(loreCommon) },
      drinkmessage: str(drinkmessage),
      drinktitle: str(drinktitle),
      glint,
      effects: EFFECTS.filter((e) => effects[e.id]?.enabled).map((e) => {
        const st = effects[e.id]!;
        const eff: { id: string; level: string; duration?: string } = {
          id: e.id,
          level: st.levelRange
            ? `${st.levelMin || "1"}-${st.levelMax || "1"}`
            : st.level.trim() === ""
              ? "1"
              : st.level.trim(),
        };
        if (st.durationRange) {
          eff.duration = `${st.durationMin || "1"}-${st.durationMax || "1"}`;
        } else if (st.duration !== "") {
          eff.duration = st.duration.trim();
        }
        return eff;
      }),
      customModelData: (() => {
        const cmds = quality ? [cmdBad, cmdNormal, cmdGood] : [cmdNormal];
        const filled = cmds.map((v) => v.trim()).filter((v) => v !== "");
        return filled.length > 0 ? filled : undefined;
      })(),
      servercommands: lines(serverCommands),
      playercommands: lines(playerCommands),
    };

    const result = validateRecipe(payload, translate);
    if (!result.ok) {
      toast.error(t("toast.invalid"), { description: result.errors.join("\n") });
      return;
    }
    setYaml(generateRecipe(result.data));
    setSummary(buildSummary(result.data, translate));
    toast.success(t("toast.generated"));
  };

  const copyYaml = async () => {
    try {
      await navigator.clipboard.writeText(yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success(t("toast.copied"));
    } catch (err) {
      toast.error(t("toast.copyFailed", { message: (err as Error).message }));
    }
  };

  const resetForm = () => {
    setRecipeKey("");
    setQuality(false);
    setNameBad("");
    setNameNormal("");
    setNameGood("");
    setLoreCommon("");
    setLoreBad("");
    setLoreNormal("");
    setLoreGood("");
    setDrinkmessage("");
    setDrinktitle("");
    setServerCommands("");
    setPlayerCommands("");
    setCmdBad("");
    setCmdNormal("");
    setCmdGood("");
    setCookingtime("0");
    setEnableDistill(false);
    setDistillruns("0");
    setDistilltime("0");
    setEnableAge(false);
    setWood(0);
    setAge("0");
    setColor("");
    setDifficulty("1");
    setAlcohol("0");
    setGlint(false);
    setEffects(initialEffectStates());
    setSelectedItem(null);
    setItemAmount(1);
    setIngredients([]);
    setSummary([]);
    setYaml("");
    setFieldErrors({});
    setCopied(false);
    toast.success(t("toast.reset"));
  };

  useEffect(() => {
    setSummary([]);
    setYaml("");
  }, [quality, recipeKey]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{t("form.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("form.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <section className="space-y-4">
          <Field label={t("key.label")}>
            <Input
              type="text"
              value={recipeKey}
              onChange={(e) => setRecipeKey(e.target.value)}
              placeholder={t("key.placeholder")}
            />
          </Field>
          <CheckboxRow
            id="quality"
            label={t("quality.label")}
            description={t("quality.desc")}
            checked={quality}
            onCheckedChange={setQuality}
          />
          <div className="space-y-3">
            {quality && (
              <Field label={t("name.bad")} required>
                <Input
                  type="text"
                  value={nameBad}
                  aria-invalid={!!fieldErrors.nameBad}
                  onChange={(e) => {
                    setNameBad(e.target.value);
                    clearFieldError("nameBad");
                  }}
                  placeholder={t("name.bad")}
                />
              </Field>
            )}
            <Field label={t("name.normal")} required>
              <Input
                type="text"
                value={nameNormal}
                aria-invalid={!!fieldErrors.name}
                onChange={(e) => {
                  setNameNormal(e.target.value);
                  clearFieldError("name");
                }}
                placeholder={t("name.normal")}
              />
            </Field>
            {quality && (
              <Field label={t("name.good")} required>
                <Input
                  type="text"
                  value={nameGood}
                  aria-invalid={!!fieldErrors.nameGood}
                  onChange={(e) => {
                    setNameGood(e.target.value);
                    clearFieldError("nameGood");
                  }}
                  placeholder={t("name.good")}
                />
              </Field>
            )}
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle title={t("lore.title")} />
          <Field label={t("lore.common")}>
            <Textarea
              value={loreCommon}
              onChange={(e) => setLoreCommon(e.target.value)}
              rows={3}
              placeholder={t("lore.commonPh")}
            />
          </Field>
          {quality && (
            <>
              <Field label={t("lore.bad")}>
                <Textarea
                  value={loreBad}
                  onChange={(e) => setLoreBad(e.target.value)}
                  rows={3}
                  placeholder={t("lore.emptyPh")}
                />
              </Field>
              <Field label={t("lore.normal")}>
                <Textarea
                  value={loreNormal}
                  onChange={(e) => setLoreNormal(e.target.value)}
                  rows={3}
                  placeholder={t("lore.emptyPh")}
                />
              </Field>
              <Field label={t("lore.good")}>
                <Textarea
                  value={loreGood}
                  onChange={(e) => setLoreGood(e.target.value)}
                  rows={3}
                  placeholder={t("lore.emptyPh")}
                />
              </Field>
            </>
          )}
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle title={t("drink.title")} />
          <Field label={t("drink.message")}>
            <Input
              type="text"
              value={drinkmessage}
              onChange={(e) => setDrinkmessage(e.target.value)}
              placeholder={t("drink.messagePh")}
            />
          </Field>
          <Field label={t("drink.drinktitle")}>
            <Input
              type="text"
              value={drinktitle}
              onChange={(e) => setDrinktitle(e.target.value)}
              placeholder={t("drink.titlePh")}
            />
          </Field>
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle title={t("commands.title")} description={t("commands.desc")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("commands.server")}>
              <Textarea
                value={serverCommands}
                onChange={(e) => setServerCommands(e.target.value)}
                rows={4}
                placeholder={t("commands.ph")}
              />
            </Field>
            <Field label={t("commands.player")}>
              <Textarea
                value={playerCommands}
                onChange={(e) => setPlayerCommands(e.target.value)}
                rows={4}
                placeholder={t("commands.ph")}
              />
            </Field>
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle title={t("ingredients.title")} description={t("ingredients.desc")} />
          <div className="flex flex-wrap items-end gap-2">
            <div className="grid min-w-[220px] flex-1 gap-1.5">
              <Label>{t("ingredients.item")}</Label>
              <Combobox
                items={itemOptions}
                value={selectedItem}
                onValueChange={setSelectedItem}
                itemToStringLabel={(item) => `${item.cn} (${item.id})`}
                isItemEqualToValue={(a, b) => a.id === b.id}
              >
                <ComboboxInput
                  placeholder={t("ingredients.searchPh")}
                  aria-invalid={!!fieldErrors.ingredients}
                />
                <ComboboxContent>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item.id} value={item}>
                        {item.cn} ({item.id})
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <Input
              type="number"
              placeholder={t("ingredients.amountPh")}
              className="h-8 w-24"
              min={1}
              max={99999}
              value={itemAmount}
              onChange={(e) => setItemAmount(Number(e.target.value))}
              onWheel={(e) => e.currentTarget.blur()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addIngredient}
              disabled={!selectedItem}
            >
              <Plus data-icon="inline-start" /> {t("ingredients.add")}
            </Button>
          </div>
          {ingredients.length > 0 && (
            <ul className="space-y-1.5">
              {ingredients.map((ing, idx) => {
                const cn = cnByItem.get(ing.item) ?? ing.item;
                return (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                  >
                    <span>
                      {cn} <span className="text-muted-foreground">x{ing.amount}</span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("ingredients.remove")}
                      onClick={() => removeIngredient(idx)}
                    >
                      <X />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle title={t("brew.title")} />
          <NumberField
            label={t("brew.cookingtime")}
            required
            min={0}
            max={720}
            value={cookingtime}
            onChange={(v) => {
              setCookingtime(v);
              clearFieldError("cookingtime");
            }}
            invalid={!!fieldErrors.cookingtime}
          />
          <div className="space-y-3">
            <CheckboxRow
              id="distill"
              label={t("brew.distill")}
              description={t("brew.distillDesc")}
              checked={enableDistill}
              onCheckedChange={setEnableDistill}
            />
            {enableDistill && (
              <div className="grid gap-4 pl-6 sm:grid-cols-2">
                <NumberField
                  label={t("brew.distillruns")}
                  min={0}
                  max={10}
                  value={distillruns}
                  onChange={setDistillruns}
                />
                <NumberField
                  label={t("brew.distilltime")}
                  min={0}
                  max={3600}
                  step={30}
                  value={distilltime}
                  onChange={setDistilltime}
                />
              </div>
            )}
          </div>
          <div className="space-y-3">
            <CheckboxRow
              id="age"
              label={t("brew.age")}
              description={t("brew.ageDesc")}
              checked={enableAge}
              onCheckedChange={setEnableAge}
            />
            {enableAge && (
              <div className="grid gap-4 pl-6 sm:grid-cols-2">
                <Field label={t("brew.wood")}>
                  <Select value={wood} onValueChange={(v) => setWood(Number(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("brew.woodPh")} />
                    </SelectTrigger>
                    <SelectContent>
                      {WOOD_OPTIONS.map((w) => (
                        <SelectItem key={w.value} value={w.value}>
                          {w.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <NumberField
                  label={t("brew.ageDays")}
                  min={0}
                  max={1000}
                  value={age}
                  onChange={setAge}
                />
              </div>
            )}
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle title={t("appearance.title")} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("appearance.color")}>
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder={t("appearance.colorPh")}
              />
            </Field>
            <NumberField
              label={t("appearance.difficulty")}
              required
              min={1}
              max={10}
              value={difficulty}
              onChange={(v) => {
                setDifficulty(v);
                clearFieldError("difficulty");
              }}
              invalid={!!fieldErrors.difficulty}
            />
            <NumberField
              label={t("appearance.alcohol")}
              min={-100}
              max={100}
              value={alcohol}
              onChange={setAlcohol}
            />
          </div>
          <div className="space-y-3">
            {quality && (
              <Field label={t("customModelData.bad")}>
                <Input
                  type="text"
                  value={cmdBad}
                  onChange={(e) => setCmdBad(e.target.value)}
                  placeholder={t("customModelData.ph")}
                />
              </Field>
            )}
            <Field label={t("customModelData.normal")}>
              <Input
                type="text"
                value={cmdNormal}
                onChange={(e) => setCmdNormal(e.target.value)}
                placeholder={t("customModelData.ph")}
              />
            </Field>
            {quality && (
              <Field label={t("customModelData.good")}>
                <Input
                  type="text"
                  value={cmdGood}
                  onChange={(e) => setCmdGood(e.target.value)}
                  placeholder={t("customModelData.ph")}
                />
              </Field>
            )}
          </div>
          <CheckboxRow
            id="glint"
            label={t("appearance.glint")}
            description={t("appearance.glintDesc")}
            checked={glint}
            onCheckedChange={setGlint}
          />
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle title={t("effects.title")} description={t("effects.desc")} />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EFFECTS.map((e) => (
              <label key={e.id} className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={effects[e.id]!.enabled}
                  onCheckedChange={(v) => setEffectEnabled(e.id, v)}
                />
                <span className="text-sm">{t(`effects.names.${e.id}`)}</span>
              </label>
            ))}
          </div>
          {enabledEffects.length > 0 && (
            <div className="rounded-lg border">
              {enabledEffects.map((e, i) => {
                const st = effects[e.id]!;
                const isInstant = INSTANT_EFFECTS.has(e.id);
                return (
                  <div
                    key={e.id}
                    className={cn(
                      "flex flex-wrap items-center gap-x-6 gap-y-3 px-3 py-2.5",
                      i > 0 && "border-t"
                    )}
                  >
                    <span className="w-24 shrink-0 text-sm font-medium">
                      {t(`effects.names.${e.id}`)}
                    </span>
                    <div className="flex min-w-40 flex-1 flex-wrap items-center gap-2">
                      <span className="w-8 shrink-0 text-xs text-muted-foreground">
                        {t("effects.level")}
                      </span>
                      <label className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground">
                        <Checkbox
                          checked={st.levelRange}
                          onCheckedChange={(v) => toggleLevelRange(e.id, v)}
                        />
                        {t("effects.range")}
                      </label>
                      {st.levelRange ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            className="w-16 text-center"
                            min={1}
                            max={255}
                            value={st.levelMin}
                            onChange={(ev) => updateEffect(e.id, { levelMin: ev.target.value })}
                            onWheel={(ev) => ev.currentTarget.blur()}
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            type="number"
                            className="w-16 text-center"
                            min={1}
                            max={255}
                            value={st.levelMax}
                            onChange={(ev) => updateEffect(e.id, { levelMax: ev.target.value })}
                            onWheel={(ev) => ev.currentTarget.blur()}
                          />
                        </div>
                      ) : (
                        <>
                          <Slider
                            className="w-36 shrink-0"
                            min={1}
                            max={255}
                            value={num(st.level) ?? 1}
                            onValueChange={(v) => updateEffect(e.id, { level: String(v) })}
                          />
                          <Input
                            type="number"
                            className="w-20 text-center"
                            min={1}
                            max={255}
                            value={st.level === "" ? "1" : st.level}
                            onChange={(ev) =>
                              updateEffect(e.id, {
                                level: ev.target.value === "" ? "1" : ev.target.value,
                              })
                            }
                            onWheel={(ev) => ev.currentTarget.blur()}
                          />
                        </>
                      )}
                    </div>
                    {!isInstant && (
                      <div className="flex min-w-40 flex-1 flex-wrap items-center gap-2">
                        <span className="w-8 shrink-0 text-xs text-muted-foreground">
                          {t("effects.time")}
                        </span>
                        <label className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground">
                          <Checkbox
                            checked={st.durationRange}
                            onCheckedChange={(v) => toggleDurationRange(e.id, v)}
                          />
                          {t("effects.range")}
                        </label>
                        {st.durationRange ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              className="w-16 text-center"
                              min={1}
                              max={1638}
                              value={st.durationMin}
                              onChange={(ev) => updateEffect(e.id, { durationMin: ev.target.value })}
                              onWheel={(ev) => ev.currentTarget.blur()}
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                              type="number"
                              className="w-16 text-center"
                              min={1}
                              max={1638}
                              value={st.durationMax}
                              onChange={(ev) => updateEffect(e.id, { durationMax: ev.target.value })}
                              onWheel={(ev) => ev.currentTarget.blur()}
                            />
                          </div>
                        ) : (
                          <>
                            <Slider
                              className="w-36 shrink-0"
                              min={1}
                              max={1638}
                              value={num(st.duration) ?? 1}
                              onValueChange={(v) =>
                                updateEffect(e.id, { duration: String(v) })
                              }
                            />
                            <Input
                              type="number"
                              className="w-20 text-center"
                              min={1}
                              max={1638}
                              value={st.duration === "" ? "1" : st.duration}
                              onChange={(ev) =>
                                updateEffect(e.id, {
                                  duration: ev.target.value === "" ? "1" : ev.target.value,
                                })
                              }
                              onWheel={(ev) => ev.currentTarget.blur()}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="flex items-center justify-between gap-2 border-t pt-5">
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button type="button" variant="outline">
                  <RotateCcw data-icon="inline-start" /> {t("actions.clear")}
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("clearDialog.title")}</AlertDialogTitle>
                <AlertDialogDescription>{t("clearDialog.desc")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("clearDialog.cancel")}</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={resetForm}>
                  {t("clearDialog.confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="submit">
            <Sparkles data-icon="inline-start" /> {t("actions.generate")}
          </Button>
        </div>
      </form>

      <Separator className="my-10" />

      <section className="space-y-4">
        {yaml ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{t("result.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("result.subtitle")}</p>
              </div>
              <Button variant="outline" onClick={copyYaml}>
                {copied ? (
                  <>
                    <Check data-icon="inline-start" /> {t("result.copied")}
                  </>
                ) : (
                  <>
                    <Copy data-icon="inline-start" /> {t("result.copy")}
                  </>
                )}
              </Button>
            </div>
            <ul className="space-y-1 text-sm">
              {summary.map((line, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: parseColorText(line) }} />
              ))}
            </ul>
            <ScrollArea className="max-h-96 rounded-lg border bg-muted/40">
              <pre className="p-4 font-mono text-xs leading-relaxed">{yaml}</pre>
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Beer className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{t("result.empty")}</p>
            <p className="text-xs text-muted-foreground">{t("result.emptyHint")}</p>
          </div>
        )}
      </section>
    </div>
  );
}
