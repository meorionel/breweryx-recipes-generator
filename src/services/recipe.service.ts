import { EFFECT_IDS, EFFECTS, INSTANT_EFFECTS } from '../data/effects'
import itemMap from '../data/item_map.json'
import {
  COLORS,
  HEX_COLOR,
  ITEM_ID_RE,
  KEY_CHARS,
  KEY_LENGTH,
  WOOD_MIN,
  WOOD_MAX,
  WOOD_OPTIONS,
  DIFFICULTY_MIN,
  DIFFICULTY_MAX,
  ALCOHOL_MIN,
  ALCOHOL_MAX,
  EFFECT_LEVEL_MIN,
  EFFECT_LEVEL_MAX,
  EFFECT_DURATION_MIN,
  EFFECT_DURATION_MAX,
  INGREDIENT_AMOUNT_MIN,
  INGREDIENT_AMOUNT_MAX,
} from '../data/constants'

const ITEM_CN_BY_ID = new Map(Object.entries(itemMap).map(([cn, id]) => [id, cn]))
const EFFECT_NAME_BY_ID = new Map(EFFECTS.map((e) => [e.id, e.name]))
const WOOD_LABEL_BY_VALUE = new Map(WOOD_OPTIONS.map((w) => [w.value, w.label]))

export type IngredientInput = { item: string; amount: number }
export type EffectInput = { id: string; level: number; duration?: number }

export type LoreInput = {
  common: string[]
  bad: string[]
  normal: string[]
  good: string[]
}

export type RecipeInput = {
  key: string
  quality: boolean
  name: string[]
  lore: LoreInput
  ingredients: IngredientInput[]
  cookingtime: number
  distillruns?: number
  distilltime?: number
  wood?: number
  age?: number
  color?: string
  difficulty: number
  alcohol?: number
  drinkmessage?: string
  glint?: boolean
  effects?: EffectInput[]
}

export type ValidationResult =
  | { ok: true; data: RecipeInput }
  | { ok: false; errors: string[] }

export function generateKey(length: number = KEY_LENGTH): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let out = ''
  const chars = KEY_CHARS.split('')
  for (let i = 0; i < length; i++) out += chars[bytes[i]! % chars.length]!
  return out
}

export function validateRecipe(raw: unknown): ValidationResult {
  const errors: string[] = []

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: ['请求体必须是一个 JSON 对象'] }
  }

  const input = raw as Record<string, unknown>

  const isEmpty = (v: unknown): boolean =>
    v === undefined || v === null || v === ''

  const optInt = (key: string, min: number, max: number): number | undefined => {
    const v = input[key]
    if (isEmpty(v)) return undefined
    const n = Number(v)
    if (Number.isNaN(n) || !Number.isFinite(n)) {
      errors.push(`${key} 必须是数字`)
      return undefined
    }
    if (!Number.isInteger(n)) {
      errors.push(`${key} 必须是整数`)
      return undefined
    }
    if (n < min || n > max) {
      errors.push(Number.isFinite(max) ? `${key} 必须在 ${min}-${max} 之间` : `${key} 必须 ≥ ${min}`)
      return undefined
    }
    return n
  }

  const reqInt = (key: string, min: number, max: number): number | undefined => {
    if (isEmpty(input[key])) {
      errors.push(`${key} 为必填项`)
      return undefined
    }
    return optInt(key, min, max)
  }

  const optString = (key: string): string | undefined => {
    const v = input[key]
    if (isEmpty(v)) return undefined
    if (typeof v !== 'string') {
      errors.push(`${key} 必须是字符串`)
      return undefined
    }
    return v.trim()
  }

  let quality = false
  if (input.quality !== undefined && input.quality !== null) {
    if (typeof input.quality !== 'boolean') {
      errors.push('quality 必须是布尔值')
    } else {
      quality = input.quality
    }
  }

  const name: string[] = []
  if (!Array.isArray(input.name)) {
    errors.push('name 必须是数组')
  } else {
    const names = input.name
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter((s) => s !== '')
    const expected = quality ? 3 : 1
    if (names.length !== expected) {
      errors.push(`name 需要 ${expected} 个非空值`)
    }
    name.push(...names)
  }

  const lore: LoreInput = { common: [], bad: [], normal: [], good: [] }
  if (input.lore !== undefined && input.lore !== null) {
    if (typeof input.lore !== 'object' || Array.isArray(input.lore)) {
      errors.push('lore 必须是对象 { common, bad, normal, good }')
    } else {
      const lr = input.lore as Record<string, unknown>
      for (const key of ['common', 'bad', 'normal', 'good'] as const) {
        const v = lr[key]
        if (v === undefined || v === null) continue
        if (!Array.isArray(v)) {
          errors.push(`lore.${key} 必须是字符串数组`)
        } else {
          lore[key] = v
            .map((s) => (typeof s === 'string' ? s.trim() : ''))
            .filter((s) => s !== '')
        }
      }
    }
  }
  if (!quality) {
    lore.bad = []
    lore.normal = []
    lore.good = []
  }

  const ingredients: IngredientInput[] = []
  if (!Array.isArray(input.ingredients)) {
    errors.push('ingredients 必须是数组')
  } else if (input.ingredients.length === 0) {
    errors.push('ingredients 至少需要一项')
  } else {
    for (const it of input.ingredients) {
      if (typeof it !== 'object' || it === null) {
        errors.push('ingredients 的每一项必须是对象 { item, amount }')
        continue
      }
      const { item, amount } = it as Record<string, unknown>
      if (typeof item !== 'string' || item.trim() === '' || !ITEM_ID_RE.test(item.trim())) {
        errors.push(`ingredients 项缺少合法的 item(如 apple)`)
        continue
      }
      if (
        typeof amount !== 'number' ||
        !Number.isInteger(amount) ||
        amount < INGREDIENT_AMOUNT_MIN ||
        amount > INGREDIENT_AMOUNT_MAX
      ) {
        errors.push(`ingredients 项 "${item}" 的数量必须是正整数`)
        continue
      }
      ingredients.push({ item: item.trim(), amount })
    }
  }

  const effects: EffectInput[] = []
  if (input.effects !== undefined && input.effects !== null) {
    if (!Array.isArray(input.effects)) {
      errors.push('effects 必须是数组')
    } else {
      for (const ef of input.effects) {
        if (typeof ef !== 'object' || ef === null) {
          errors.push('effects 的每一项必须是对象 { id, level, duration }')
          continue
        }
        const { id, level, duration } = ef as Record<string, unknown>
        if (typeof id !== 'string' || !EFFECT_IDS.has(id)) {
          errors.push(`effects 项 "${String(id)}" 不是有效的药水效果`)
          continue
        }
        if (
          typeof level !== 'number' ||
          !Number.isInteger(level) ||
          level < EFFECT_LEVEL_MIN ||
          level > EFFECT_LEVEL_MAX
        ) {
          errors.push(`effects 项 "${id}" 的等级必须是 ${EFFECT_LEVEL_MIN}-${EFFECT_LEVEL_MAX} 的整数`)
          continue
        }
        let dur: number | undefined
        if (duration !== undefined && duration !== null && duration !== '') {
          if (
            typeof duration !== 'number' ||
            !Number.isInteger(duration) ||
            duration < EFFECT_DURATION_MIN ||
            duration > EFFECT_DURATION_MAX
          ) {
            errors.push(`effects 项 "${id}" 的时长必须是 ${EFFECT_DURATION_MIN}-${EFFECT_DURATION_MAX} 秒的整数`)
            continue
          }
          dur = duration
        }
        effects.push({ id, level, duration: dur })
      }
    }
  }

  const cookingtime = reqInt('cookingtime', 0, Infinity)
  const distillruns = optInt('distillruns', 0, Infinity)
  const distilltime = optInt('distilltime', 0, Infinity)
  const wood = optInt('wood', WOOD_MIN, WOOD_MAX)
  const age = optInt('age', 0, Infinity)
  const difficulty = reqInt('difficulty', DIFFICULTY_MIN, DIFFICULTY_MAX)
  const alcohol = optInt('alcohol', ALCOHOL_MIN, ALCOHOL_MAX)

  const color = optString('color')
  if (color && !COLORS.has(color.toUpperCase()) && !HEX_COLOR.test(color)) {
    errors.push(`color "${color}" 必须是颜色名或 6 位 HEX(不带 #)`)
  }

  const drinkmessage = optString('drinkmessage')

  let glint: boolean | undefined
  if (input.glint !== undefined && input.glint !== null && input.glint !== '') {
    if (typeof input.glint === 'boolean') {
      glint = input.glint
    } else if (typeof input.glint === 'string' && (input.glint === 'true' || input.glint === 'false')) {
      glint = input.glint === 'true'
    } else {
      errors.push('glint 必须是布尔值 true/false')
    }
  }

  const rawKey = optString('key')

  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    data: {
      key: rawKey && rawKey !== '' ? rawKey : generateKey(),
      quality,
      name,
      lore,
      ingredients,
      cookingtime: cookingtime!,
      distillruns,
      distilltime,
      wood,
      age,
      color,
      difficulty: difficulty!,
      alcohol,
      drinkmessage,
      glint,
      effects,
    },
  }
}

function quoteIfNeeded(value: string, forceQuote = false): string {
  if (value === '') return "''"
  const isNumeric = /^[-+]?(\d+\.?\d*|\.\d+)$/.test(value)
  const isBooleanLike = /^(true|false|null|yes|no|on|off)$/i.test(value)
  const hasSpecialStart = /^[\s\-?:,\[\]{}#&*!|>'"%@`]/.test(value)
  const hasSpecialInside = /:\s| #|:$|\n/.test(value) || /[&#]/.test(value)
  if (forceQuote || isNumeric || isBooleanLike || hasSpecialStart || hasSpecialInside) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  }
  return value
}

function buildRecipe(input: RecipeInput): string[] {
  const lines: string[] = []
  const pad = (depth: number) => '  '.repeat(depth)

  const addScalar = (depth: number, key: string, value: string | number | boolean | undefined, forceQuote = false) => {
    if (value === undefined || value === null) return
    const rendered = typeof value === 'string' ? quoteIfNeeded(value, forceQuote) : String(value)
    lines.push(`${pad(depth)}${key}: ${rendered}`)
  }

  const addList = (depth: number, key: string, items: string[] | undefined) => {
    if (!items || items.length === 0) return
    lines.push(`${pad(depth)}${key}:`)
    for (const item of items) {
      lines.push(`${pad(depth + 1)}- ${quoteIfNeeded(item)}`)
    }
  }

  const nameValue = input.name.length === 3 ? input.name.join('/') : input.name[0]

  const loreLines: string[] = []
  loreLines.push(...input.lore.common)
  if (input.quality) {
    for (const line of input.lore.bad) loreLines.push(`+${line}`)
    for (const line of input.lore.normal) loreLines.push(`++${line}`)
    for (const line of input.lore.good) loreLines.push(`+++${line}`)
  }

  addScalar(0, 'name', nameValue)
  addList(
    0,
    'ingredients',
    input.ingredients.map((it) => `${it.item}/${it.amount}`)
  )
  addScalar(0, 'cookingtime', input.cookingtime)
  addScalar(0, 'distillruns', input.distillruns)
  addScalar(0, 'distilltime', input.distilltime)
  addScalar(0, 'wood', input.wood)
  addScalar(0, 'age', input.age)
  addScalar(0, 'color', input.color, true)
  addScalar(0, 'difficulty', input.difficulty)
  addScalar(0, 'alcohol', input.alcohol)
  addList(0, 'lore', loreLines)
  addScalar(0, 'drinkmessage', input.drinkmessage)
  addScalar(0, 'glint', input.glint)
  addList(
    0,
    'effects',
    input.effects?.map((ef) => {
      const base = `${ef.id.toUpperCase()}/${ef.level}`
      return INSTANT_EFFECTS.has(ef.id) ? base : `${base}/${ef.duration ?? 1}`
    })
  )

  return lines
}

export function generateRecipe(input: RecipeInput): string {
  const body = buildRecipe(input)
  return `${input.key}:\n${body.map((line) => `  ${line}`).join('\n')}\n`
}

export function buildSummary(input: RecipeInput): string[] {
  const lines: string[] = []

  lines.push(
    input.name.length === 3 ? `名称: ${input.name.join(' / ')}` : `名称: ${input.name[0]}`
  )

  const ingredientsText = input.ingredients
    .map((it) => `${ITEM_CN_BY_ID.get(it.item) ?? it.item} x${it.amount}`)
    .join(', ')
  lines.push(`原料: ${ingredientsText}`)

  lines.push(`煮制时间: ${input.cookingtime} 分钟`)
  if (input.distillruns !== undefined) lines.push(`蒸馏次数: ${input.distillruns} 次`)
  if (input.distilltime !== undefined) lines.push(`单次蒸馏时间: ${input.distilltime} 秒`)
  if (input.wood !== undefined) {
    lines.push(`木材: ${WOOD_LABEL_BY_VALUE.get(input.wood) ?? input.wood}`)
  }
  if (input.age !== undefined) lines.push(`陈酿时间: ${input.age} 天`)
  if (input.color) lines.push(`颜色: ${input.color}`)
  lines.push(`难度: ${input.difficulty}`)
  if (input.alcohol !== undefined) lines.push(`酒精度: ${input.alcohol}`)

  const loreTexts: string[] = []
  if (input.quality) {
    const groups: [string, string[]][] = [
      ['通用', input.lore.common],
      ['劣质', input.lore.bad],
      ['普通', input.lore.normal],
      ['优质', input.lore.good],
    ]
    for (const [label, group] of groups) {
      for (const line of group) loreTexts.push(`[${label}] ${line}`)
    }
  } else {
    loreTexts.push(...input.lore.common)
  }
  if (loreTexts.length > 0) lines.push(`描述: ${loreTexts.join('; ')}`)

  if (input.drinkmessage) lines.push(`饮用消息: ${input.drinkmessage}`)
  if (input.glint) lines.push('发光: 是')

  if (input.effects && input.effects.length > 0) {
    const effectsText = input.effects
      .map((ef) => {
        const name = EFFECT_NAME_BY_ID.get(ef.id) ?? ef.id
        const durationText = INSTANT_EFFECTS.has(ef.id) ? '' : `, ${ef.duration ?? 1}秒`
        return `${name}(等级${ef.level}${durationText})`
      })
      .join('; ')
    lines.push(`效果: ${effectsText}`)
  }

  return lines
}
