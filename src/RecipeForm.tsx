import { useEffect, useMemo, useState } from "react";
import { EFFECTS, INSTANT_EFFECTS } from "./data/effects";
import { WOOD_OPTIONS } from "./data/constants";
import itemMap from "./data/item_map.json";
import {
  validateRecipe,
  generateRecipe,
  buildSummary,
  type IngredientInput,
} from "./services/recipe.service";

type EffectState = { enabled: boolean; level: string; duration: string };
type EffectStates = Record<string, EffectState>;

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
  const [cookingtime, setCookingtime] = useState("");
  const [enableDistill, setEnableDistill] = useState(false);
  const [distillruns, setDistillruns] = useState("");
  const [distilltime, setDistilltime] = useState("");
  const [enableAge, setEnableAge] = useState(false);
  const [wood, setWood] = useState(0);
  const [age, setAge] = useState("");
  const [color, setColor] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [alcohol, setAlcohol] = useState("");
  const [glint, setGlint] = useState(false);
  const [effects, setEffects] = useState<EffectStates>(initialEffectStates);

  const [itemQuery, setItemQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [itemAmount, setItemAmount] = useState(1);
  const [ingredients, setIngredients] = useState<IngredientInput[]>([]);

  const [summary, setSummary] = useState<string[]>([]);
  const [yaml, setYaml] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const itemResults = useMemo(() => {
    const kw = itemQuery.trim().toLowerCase();
    if (!kw) return [];
    return Object.entries(itemMap)
      .filter(([cn, id]) => cn.toLowerCase().includes(kw) || String(id).toLowerCase().includes(kw))
      .slice(0, 8);
  }, [itemQuery]);

  const selectItem = (id: string, cn: string) => {
    setSelectedItem(id);
    setItemQuery(`${cn} (${id})`);
  };

  const addIngredient = () => {
    if (!selectedItem) {
      alert("请先从查询结果中选择物品");
      return;
    }
    if (Number.isNaN(itemAmount) || itemAmount <= 0) {
      alert("数量必须是正整数");
      return;
    }
    setIngredients((prev) => [...prev, { item: selectedItem, amount: itemAmount }]);
    setSelectedItem(null);
    setItemQuery("");
    setItemAmount(1);
  };

  const removeIngredient = (idx: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateEffect = (id: string, patch: Partial<EffectState>) => {
    setEffects((prev) => ({ ...prev, [id]: { ...prev[id]!, ...patch } }));
  };

  const setEffectEnabled = (id: string, enabled: boolean) => {
    setEffects((prev) => ({ ...prev, [id]: { ...prev[id]!, enabled } }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

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
      setError(result.errors.join("\n"));
      return;
    }
    setYaml(generateRecipe(result.data));
    setSummary(buildSummary(result.data));
  };

  const copyYaml = async () => {
    try {
      await navigator.clipboard.writeText(yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      setError(`复制失败: ${(err as Error).message}`);
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
    setCookingtime("");
    setEnableDistill(false);
    setDistillruns("");
    setDistilltime("");
    setEnableAge(false);
    setWood(0);
    setAge("");
    setColor("");
    setDifficulty("");
    setAlcohol("");
    setGlint(false);
    setEffects(initialEffectStates());
    setItemQuery("");
    setSelectedItem(null);
    setItemAmount(1);
    setIngredients([]);
    setSummary([]);
    setYaml("");
    setError("");
    setCopied(false);
  };

  useEffect(() => {
    setSummary([]);
    setYaml("");
  }, [quality]);

  return (
    <div>
      <div>
        <form onSubmit={handleSubmit}>
          <label>
            <input type="checkbox" checked={quality} onChange={(e) => setQuality(e.target.checked)} />
            区分三种品质
          </label>

          <div>
            <span>
              名称 <span>*</span>
            </span>
            {quality && (
              <input
                type="text"
                value={nameBad}
                onChange={(e) => setNameBad(e.target.value)}
                placeholder="劣质名称"
              />
            )}
            <input
              type="text"
              required
              value={nameNormal}
              onChange={(e) => setNameNormal(e.target.value)}
              placeholder="普通名称"
            />
            {quality && (
              <input
                type="text"
                value={nameGood}
                onChange={(e) => setNameGood(e.target.value)}
                placeholder="优质名称"
              />
            )}
          </div>

          <div>
            <div>通用描述(任何品质都显示,留空则不输出)</div>
            <textarea
              value={loreCommon}
              onChange={(e) => setLoreCommon(e.target.value)}
              rows={3}
              placeholder="通用描述,每行一个,可添加多行"
            />
            {quality && (
              <div>
                <div>劣质品质描述</div>
                <textarea
                  value={loreBad}
                  onChange={(e) => setLoreBad(e.target.value)}
                  rows={3}
                  placeholder="劣质品质显示,留空则不输出"
                />
                <div>普通品质描述</div>
                <textarea
                  value={loreNormal}
                  onChange={(e) => setLoreNormal(e.target.value)}
                  rows={3}
                  placeholder="普通品质显示,留空则不输出"
                />
                <div>优质品质描述</div>
                <textarea
                  value={loreGood}
                  onChange={(e) => setLoreGood(e.target.value)}
                  rows={3}
                  placeholder="优质品质显示,留空则不输出"
                />
              </div>
            )}
          </div>

          <div>
            <span>饮用消息</span>
            <input
              type="text"
              value={drinkmessage}
              onChange={(e) => setDrinkmessage(e.target.value)}
              placeholder="味道不错"
            />
          </div>

          <div>
            <div>
              原料 <span>*</span>
            </div>
            <input
              type="text"
              value={itemQuery}
              onChange={(e) => setItemQuery(e.target.value)}
              placeholder="输入中文或 id 查询物品"
            />
            <div>
              {itemResults.map(([cn, id]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectItem(id, cn)}
                >
                  {cn} ({id})
                </button>
              ))}
            </div>
            <div>
              <div>
                <span>数量</span>
                <input
                  type="number"
                  value={itemAmount}
                  min={1}
                  max={99999}
                  onChange={(e) => setItemAmount(Number(e.target.value))}
                />
              </div>
              <button type="button" onClick={addIngredient}>
                添加原料
              </button>
            </div>
            <div>
              {ingredients.map((ing, idx) => {
                const cn = cnByItem.get(ing.item) ?? ing.item;
                return (
                  <div key={idx}>
                    <span>
                      {cn} x{ing.amount}
                    </span>
                    <button type="button" onClick={() => removeIngredient(idx)}>
                      删除
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div>
              煮 <span>*</span>
            </div>
            <div>
              <span>煮制时间(分钟)</span>
              <input
                type="number"
                required
                min={0}
                value={cookingtime}
                onChange={(e) => setCookingtime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                checked={enableDistill}
                onChange={(e) => setEnableDistill(e.target.checked)}
              />
              蒸馏
            </label>
            {enableDistill && (
              <div>
                <div>
                  <span>蒸馏次数</span>
                  <input
                    type="number"
                    min={0}
                    value={distillruns}
                    onChange={(e) => setDistillruns(e.target.value)}
                  />
                </div>
                <div>
                  <span>单次蒸馏时间(秒)</span>
                  <input
                    type="number"
                    min={0}
                    value={distilltime}
                    onChange={(e) => setDistilltime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                checked={enableAge}
                onChange={(e) => setEnableAge(e.target.checked)}
              />
              陈酿
            </label>
            {enableAge && (
              <div>
                <div>
                  <span>酒桶木材</span>
                  <select value={wood} onChange={(e) => setWood(Number(e.target.value))}>
                    {WOOD_OPTIONS.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span>陈酿时间(MC 天数)</span>
                  <input
                    type="number"
                    min={0}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <div>
              <span>颜色</span>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="DARK_RED"
              />
            </div>
            <div>
              <span>
                难度 1-10 <span>*</span>
              </span>
              <input
                type="number"
                required
                min={1}
                max={10}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              />
            </div>
            <div>
              <span>酒精度(-100 ~ 100)</span>
              <input
                type="number"
                min={-100}
                max={100}
                value={alcohol}
                onChange={(e) => setAlcohol(e.target.value)}
              />
            </div>
          </div>

          <label>
            <input type="checkbox" checked={glint} onChange={(e) => setGlint(e.target.checked)} />
            药水瓶是否显示附魔效果
          </label>

          <div>
            <div>药水效果</div>
            <div>
              {EFFECTS.map((effect) => {
                const st = effects[effect.id]!;
                const isInstant = INSTANT_EFFECTS.has(effect.id);
                return (
                  <div key={effect.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={st.enabled}
                        onChange={(e) => setEffectEnabled(effect.id, e.target.checked)}
                      />
                      {effect.name}
                    </label>
                    {st.enabled && (
                      <>
                        <input
                          type="number"
                          min={1}
                          max={255}
                          value={st.level}
                          onChange={(e) => updateEffect(effect.id, { level: e.target.value })}
                          placeholder="等级"
                        />
                        {!isInstant && (
                          <input
                            type="number"
                            min={1}
                            max={1638}
                            value={st.duration}
                            onChange={(e) => updateEffect(effect.id, { duration: e.target.value })}
                            placeholder="秒"
                          />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <button type="button" onClick={resetForm}>
              一键清空
            </button>
            <button type="submit">
              生成
            </button>
          </div>
        </form>

        {yaml && (
          <section>
            <h2>生成的配方</h2>
            <ul>
              {summary.map((line, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: parseColorText(line) }} />
              ))}
            </ul>
            <textarea readOnly value={yaml} rows={10} />
            <button type="button" onClick={copyYaml}>
              {copied ? "已复制!" : "复制配方代码"}
            </button>
          </section>
        )}

        {error && <div>{error}</div>}
      </div>
    </div>
  );
}
