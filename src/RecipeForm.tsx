import { useEffect, useMemo, useState } from "react";
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

type EffectState = { enabled: boolean; level: string; duration: string };
type EffectStates = Record<string, EffectState>;
type ItemOption = { cn: string; id: string };

const initialEffectStates = (): EffectStates =>
  Object.fromEntries(EFFECTS.map((e) => [e.id, { enabled: false, level: "", duration: "" }]));

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
  const [quality, setQuality] = useState(false);
  const [nameBad, setNameBad] = useState("");
  const [nameNormal, setNameNormal] = useState("");
  const [nameGood, setNameGood] = useState("");
  const [loreCommon, setLoreCommon] = useState("");
  const [loreBad, setLoreBad] = useState("");
  const [loreNormal, setLoreNormal] = useState("");
  const [loreGood, setLoreGood] = useState("");
  const [drinkmessage, setDrinkmessage] = useState("");
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
      toast.error("请先从查询结果中选择物品");
      return;
    }
    if (Number.isNaN(itemAmount) || itemAmount <= 0) {
      toast.error("数量必须是正整数");
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

  const setEffectEnabled = (id: string, enabled: boolean) => {
    setEffects((prev) => ({ ...prev, [id]: { ...prev[id]!, enabled } }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errs: Record<string, string> = {};
    if (!str(nameNormal)) errs.name = "请填写普通名称";
    if (quality && !str(nameBad)) errs.nameBad = "请填写劣质名称";
    if (quality && !str(nameGood)) errs.nameGood = "请填写优质名称";
    if (num(cookingtime) === undefined) errs.cookingtime = "请填写煮制时间(分钟)";
    if (num(difficulty) === undefined) errs.difficulty = "请填写难度(1-10)";
    if (ingredients.length === 0) errs.ingredients = "请添加至少一种原料";

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      toast.error("请完善必填项", { description: Object.values(errs).join("\n") });
      return;
    }
    setFieldErrors({});

    const payload = {
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
      glint,
      effects: EFFECTS.filter((e) => effects[e.id]?.enabled).map((e) => {
        const st = effects[e.id]!;
        const eff: { id: string; level: number; duration?: number } = {
          id: e.id,
          level: Number(st.level),
        };
        if (st.duration !== "") eff.duration = Number(st.duration);
        return eff;
      }),
    };

    const result = validateRecipe(payload);
    if (!result.ok) {
      toast.error("配方校验失败", { description: result.errors.join("\n") });
      return;
    }
    setYaml(generateRecipe(result.data));
    setSummary(buildSummary(result.data));
    toast.success("配方已生成");
  };

  const copyYaml = async () => {
    try {
      await navigator.clipboard.writeText(yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("配方代码已复制");
    } catch (err) {
      toast.error(`复制失败: ${(err as Error).message}`);
    }
  };

  const resetForm = () => {
    setQuality(false);
    setNameBad("");
    setNameNormal("");
    setNameGood("");
    setLoreCommon("");
    setLoreBad("");
    setLoreNormal("");
    setLoreGood("");
    setDrinkmessage("");
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
    toast.success("表单已清空");
  };

  useEffect(() => {
    setSummary([]);
    setYaml("");
  }, [quality]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">配方信息</h2>
        <p className="text-sm text-muted-foreground">填写酿造参数,生成 BreweryX 配方代码</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <section className="space-y-4">
          <CheckboxRow
            id="quality"
            label="区分三种品质"
            description="分别填写劣质、普通、优质三种品质的名称与描述"
            checked={quality}
            onCheckedChange={setQuality}
          />
          <div className="space-y-3">
            {quality && (
              <Field label="劣质名称" required>
                <Input
                  type="text"
                  value={nameBad}
                  aria-invalid={!!fieldErrors.nameBad}
                  onChange={(e) => {
                    setNameBad(e.target.value);
                    clearFieldError("nameBad");
                  }}
                  placeholder="劣质名称"
                />
              </Field>
            )}
            <Field label="普通名称" required>
              <Input
                type="text"
                value={nameNormal}
                aria-invalid={!!fieldErrors.name}
                onChange={(e) => {
                  setNameNormal(e.target.value);
                  clearFieldError("name");
                }}
                placeholder="普通名称"
              />
            </Field>
            {quality && (
              <Field label="优质名称" required>
                <Input
                  type="text"
                  value={nameGood}
                  aria-invalid={!!fieldErrors.nameGood}
                  onChange={(e) => {
                    setNameGood(e.target.value);
                    clearFieldError("nameGood");
                  }}
                  placeholder="优质名称"
                />
              </Field>
            )}
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle title="描述" />
          <Field label="通用描述">
            <Textarea
              value={loreCommon}
              onChange={(e) => setLoreCommon(e.target.value)}
              rows={3}
              placeholder="任何品质都显示,每行一条"
            />
          </Field>
          {quality && (
            <>
              <Field label="劣质品质描述">
                <Textarea
                  value={loreBad}
                  onChange={(e) => setLoreBad(e.target.value)}
                  rows={3}
                  placeholder="劣质品质显示,留空则不输出"
                />
              </Field>
              <Field label="普通品质描述">
                <Textarea
                  value={loreNormal}
                  onChange={(e) => setLoreNormal(e.target.value)}
                  rows={3}
                  placeholder="普通品质显示,留空则不输出"
                />
              </Field>
              <Field label="优质品质描述">
                <Textarea
                  value={loreGood}
                  onChange={(e) => setLoreGood(e.target.value)}
                  rows={3}
                  placeholder="优质品质显示,留空则不输出"
                />
              </Field>
            </>
          )}
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle title="饮用消息" />
          <Input
            type="text"
            value={drinkmessage}
            onChange={(e) => setDrinkmessage(e.target.value)}
            placeholder="味道不错"
          />
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle title="原料" description="搜索物品后添加到配方中" />
          <div className="flex flex-wrap items-end gap-2">
            <div className="grid min-w-[220px] flex-1 gap-1.5">
              <Label>物品</Label>
              <Combobox
                items={itemOptions}
                value={selectedItem}
                onValueChange={setSelectedItem}
                itemToStringLabel={(item) => `${item.cn} (${item.id})`}
                isItemEqualToValue={(a, b) => a.id === b.id}
              >
                <ComboboxInput
                  placeholder="输入中文或 id 查询物品"
                  aria-invalid={!!fieldErrors.ingredients}
                />
                <ComboboxContent>
                  <ComboboxList>
                    {itemOptions.map((item) => (
                      <ComboboxItem key={item.id} value={item}>
                        {item.cn} ({item.id})
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <Input
              type="number"
              placeholder="数量"
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
              <Plus data-icon="inline-start" /> 添加
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
                      aria-label="删除"
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
          <SectionTitle title="酿造参数" />
          <NumberField
            label="煮制时间(分钟)"
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
              label="蒸馏"
              description="进行二次蒸馏以获得更高浓度"
              checked={enableDistill}
              onCheckedChange={setEnableDistill}
            />
            {enableDistill && (
              <div className="grid gap-4 pl-6 sm:grid-cols-2">
                <NumberField
                  label="蒸馏次数"
                  min={0}
                  max={10}
                  value={distillruns}
                  onChange={setDistillruns}
                />
                <NumberField
                  label="单次蒸馏时间(秒)"
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
              label="陈酿"
              description="在酒桶中陈酿以提升品质"
              checked={enableAge}
              onCheckedChange={setEnableAge}
            />
            {enableAge && (
              <div className="grid gap-4 pl-6 sm:grid-cols-2">
                <Field label="酒桶木材">
                  <Select value={wood} onValueChange={(v) => setWood(Number(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择木材" />
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
                  label="陈酿时间(MC 天数)"
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
          <SectionTitle title="外观与难度" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="颜色">
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="DARK_RED"
              />
            </Field>
            <NumberField
              label="难度(1-10)"
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
              label="酒精度(-100 ~ 100)"
              min={-100}
              max={100}
              value={alcohol}
              onChange={setAlcohol}
            />
          </div>
          <CheckboxRow
            id="glint"
            label="附魔光泽"
            description="药水瓶是否显示附魔效果"
            checked={glint}
            onCheckedChange={setGlint}
          />
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle title="药水效果" description="勾选启用效果,并在下方设置等级与持续时间" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EFFECTS.map((e) => (
              <label key={e.id} className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={effects[e.id]!.enabled}
                  onCheckedChange={(v) => setEffectEnabled(e.id, v)}
                />
                <span className="text-sm">{e.name}</span>
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
                    <span className="w-24 shrink-0 text-sm font-medium">{e.name}</span>
                    <div className="flex min-w-40 flex-1 items-center gap-2">
                      <span className="w-8 shrink-0 text-xs text-muted-foreground">等级</span>
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
                    </div>
                    {!isInstant && (
                      <div className="flex min-w-40 flex-1 items-center gap-2">
                        <span className="w-8 shrink-0 text-xs text-muted-foreground">时间</span>
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
                  <RotateCcw data-icon="inline-start" /> 一键清空
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认清空?</AlertDialogTitle>
                <AlertDialogDescription>
                  所有已填写的配方数据将被清除,此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={resetForm}>
                  清空
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="submit">
            <Sparkles data-icon="inline-start" /> 生成配方
          </Button>
        </div>
      </form>

      <Separator className="my-10" />

      <section className="space-y-4">
        {yaml ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">生成的配方</h2>
                <p className="text-sm text-muted-foreground">配方预览与 YAML 代码</p>
              </div>
              <Button variant="outline" onClick={copyYaml}>
                {copied ? (
                  <>
                    <Check data-icon="inline-start" /> 已复制!
                  </>
                ) : (
                  <>
                    <Copy data-icon="inline-start" /> 复制代码
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
            <p className="text-sm font-medium">还没有配方</p>
            <p className="text-xs text-muted-foreground">填写上方表单后点击「生成配方」</p>
          </div>
        )}
      </section>
    </div>
  );
}
