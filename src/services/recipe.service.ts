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

export type Translate = (key: string, vars?: Record<string, string | number>) => string

export function generateKey(length: number = KEY_LENGTH): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let out = ''
  const chars = KEY_CHARS.split('')
  for (let i = 0; i < length; i++) out += chars[bytes[i]! % chars.length]!
  return out
}

export function validateRecipe(raw: unknown, translate?: Translate): ValidationResult {
  const errors: string[] = []
  const t = (key: string, fallback: string, vars?: Record<string, string | number>): string =>
    translate ? translate(key, vars) : fallback

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: [t('validate.reqObject', '请求体必须是一个 JSON 对象')] }
  }

  const input = raw as Record<string, unknown>

  const isEmpty = (v: unknown): boolean =>
    v === undefined || v === null || v === ''

  const optInt = (key: string, min: number, max: number): number | undefined => {
    const v = input[key]
    if (isEmpty(v)) return undefined
    const n = Number(v)
    if (Number.isNaN(n) || !Number.isFinite(n)) {
      errors.push(t('validate.keyNotNumber', `${key} 必须是数字`, { key }))
      return undefined
    }
    if (!Number.isInteger(n)) {
      errors.push(t('validate.keyNotInteger', `${key} 必须是整数`, { key }))
      return undefined
    }
    if (n < min || n > max) {
      errors.push(
        Number.isFinite(max)
          ? t('validate.keyRange', `${key} 必须在 ${min}-${max} 之间`, { key, min, max })
          : t('validate.keyMin', `${key} 必须 ≥ ${min}`, { key, min })
      )
      return undefined
    }
    return n
  }

  const reqInt = (key: string, min: number, max: number): number | undefined => {
    if (isEmpty(input[key])) {
      errors.push(t('validate.keyRequired', `${key} 为必填项`, { key }))
      return undefined
    }
    return optInt(key, min, max)
  }

  const optString = (key: string): string | undefined => {
    const v = input[key]
    if (isEmpty(v)) return undefined
    if (typeof v !== 'string') {
      errors.push(t('validate.keyNotString', `${key} 必须是字符串`, { key }))
      return undefined
    }
    return v.trim()
  }

  let quality = false
  if (input.quality !== undefined && input.quality !== null) {
    if (typeof input.quality !== 'boolean') {
      errors.push(t('validate.qualityNotBoolean', 'quality 必须是布尔值'))
    } else {
      quality = input.quality
    }
  }

  const name: string[] = []
  if (!Array.isArray(input.name)) {
    errors.push(t('validate.nameNotArray', 'name 必须是数组'))
  } else {
    const names = input.name
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter((s) => s !== '')
    const expected = quality ? 3 : 1
    if (names.length !== expected) {
      errors.push(t('validate.nameCount', `name 需要 ${expected} 个非空值`, { count: expected }))
    }
    name.push(...names)
  }

  const lore: LoreInput = { common: [], bad: [], normal: [], good: [] }
  if (input.lore !== undefined && input.lore !== null) {
    if (typeof input.lore !== 'object' || Array.isArray(input.lore)) {
      errors.push(t('validate.loreNotObject', 'lore 必须是对象 { common, bad, normal, good }'))
    } else {
      const lr = input.lore as Record<string, unknown>
      for (const key of ['common', 'bad', 'normal', 'good'] as const) {
        const v = lr[key]
        if (v === undefined || v === null) continue
        if (!Array.isArray(v)) {
          errors.push(t('validate.loreKeyNotArray', `lore.${key} 必须是字符串数组`, { key }))
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
    errors.push(t('validate.ingredientsNotArray', 'ingredients 必须是数组'))
  } else if (input.ingredients.length === 0) {
    errors.push(t('validate.ingredientsEmpty', 'ingredients 至少需要一项'))
  } else {
    for (const it of input.ingredients) {
      if (typeof it !== 'object' || it === null) {
        errors.push(t('validate.ingredientNotObject', 'ingredients 的每一项必须是对象 { item, amount }'))
        continue
      }
      const { item, amount } = it as Record<string, unknown>
      if (typeof item !== 'string' || item.trim() === '' || !ITEM_ID_RE.test(item.trim())) {
        errors.push(t('validate.ingredientBadItem', 'ingredients 项缺少合法的 item(如 apple)'))
        continue
      }
      if (
        typeof amount !== 'number' ||
        !Number.isInteger(amount) ||
        amount < INGREDIENT_AMOUNT_MIN ||
        amount > INGREDIENT_AMOUNT_MAX
      ) {
        errors.push(
          t('validate.ingredientBadAmount', `ingredients 项 "${item}" 的数量必须是正整数`, {
            item: String(item),
          })
        )
        continue
      }
      ingredients.push({ item: item.trim(), amount })
    }
  }

  const effects: EffectInput[] = []
  if (input.effects !== undefined && input.effects !== null) {
    if (!Array.isArray(input.effects)) {
      errors.push(t('validate.effectsNotArray', 'effects 必须是数组'))
    } else {
      for (const ef of input.effects) {
        if (typeof ef !== 'object' || ef === null) {
          errors.push(t('validate.effectNotObject', 'effects 的每一项必须是对象 { id, level, duration }'))
          continue
        }
        const { id, level, duration } = ef as Record<string, unknown>
        if (typeof id !== 'string' || !EFFECT_IDS.has(id)) {
          errors.push(
            t('validate.effectBadId', `effects 项 "${String(id)}" 不是有效的药水效果`, { id: String(id) })
          )
          continue
        }
        if (
          typeof level !== 'number' ||
          !Number.isInteger(level) ||
          level < EFFECT_LEVEL_MIN ||
          level > EFFECT_LEVEL_MAX
        ) {
          errors.push(
            t(
              'validate.effectBadLevel',
              `effects 项 "${id}" 的等级必须是 ${EFFECT_LEVEL_MIN}-${EFFECT_LEVEL_MAX} 的整数`,
              { id, min: EFFECT_LEVEL_MIN, max: EFFECT_LEVEL_MAX }
            )
          )
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
            errors.push(
              t(
                'validate.effectBadDuration',
                `effects 项 "${id}" 的时长必须是 ${EFFECT_DURATION_MIN}-${EFFECT_DURATION_MAX} 秒的整数`,
                { id, min: EFFECT_DURATION_MIN, max: EFFECT_DURATION_MAX }
              )
            )
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
    errors.push(
      t('validate.colorInvalid', `color "${color}" 必须是颜色名或 6 位 HEX(不带 #)`, { color })
    )
  }

  const drinkmessage = optString('drinkmessage')

  let glint: boolean | undefined
  if (input.glint !== undefined && input.glint !== null && input.glint !== '') {
    if (typeof input.glint === 'boolean') {
      glint = input.glint
    } else if (typeof input.glint === 'string' && (input.glint === 'true' || input.glint === 'false')) {
      glint = input.glint === 'true'
    } else {
      errors.push(t('validate.glintNotBoolean', 'glint 必须是布尔值 true/false'))
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

export function buildSummary(input: RecipeInput, translate?: Translate): string[] {
  const lines: string[] = []
  const t = (key: string, fallback: string, vars?: Record<string, string | number>): string =>
    translate ? translate(key, vars) : fallback

  const nameText = input.name.length === 3 ? input.name.join(' / ') : input.name[0]!
  lines.push(t('summary.name', `名称: ${nameText}`, { name: nameText }))

  const ingredientsText = input.ingredients
    .map((it) => `${ITEM_CN_BY_ID.get(it.item) ?? it.item} x${it.amount}`)
    .join(', ')
  lines.push(t('summary.ingredients', `原料: ${ingredientsText}`, { ingredients: ingredientsText }))

  lines.push(t('summary.cookingtime', `煮制时间: ${input.cookingtime} 分钟`, { value: input.cookingtime }))
  if (input.distillruns !== undefined) {
    lines.push(t('summary.distillruns', `蒸馏次数: ${input.distillruns} 次`, { value: input.distillruns }))
  }
  if (input.distilltime !== undefined) {
    lines.push(t('summary.distilltime', `单次蒸馏时间: ${input.distilltime} 秒`, { value: input.distilltime }))
  }
  if (input.wood !== undefined) {
    const woodText = WOOD_LABEL_BY_VALUE.get(input.wood) ?? String(input.wood)
    lines.push(t('summary.wood', `木材: ${woodText}`, { value: woodText }))
  }
  if (input.age !== undefined) {
    lines.push(t('summary.age', `陈酿时间: ${input.age} 天`, { value: input.age }))
  }
  if (input.color) {
    lines.push(t('summary.color', `颜色: ${input.color}`, { value: input.color }))
  }
  lines.push(t('summary.difficulty', `难度: ${input.difficulty}`, { value: input.difficulty }))
  if (input.alcohol !== undefined) {
    lines.push(t('summary.alcohol', `酒精度: ${input.alcohol}`, { value: input.alcohol }))
  }

  const loreTexts: string[] = []
  if (input.quality) {
    const groups: [string, string[]][] = [
      ['common', input.lore.common],
      ['bad', input.lore.bad],
      ['normal', input.lore.normal],
      ['good', input.lore.good],
    ]
    const groupLabels: Record<string, string> = {
      common: t('summary.loreGroup.common', '通用'),
      bad: t('summary.loreGroup.bad', '劣质'),
      normal: t('summary.loreGroup.normal', '普通'),
      good: t('summary.loreGroup.good', '优质'),
    }
    for (const [labelKey, group] of groups) {
      for (const line of group) {
        const label = groupLabels[labelKey] ?? labelKey
        loreTexts.push(t('summary.loreLine', `[${label}] ${line}`, { label, line }))
      }
    }
  } else {
    loreTexts.push(...input.lore.common)
  }
  if (loreTexts.length > 0) {
    const loreText = loreTexts.join('; ')
    lines.push(t('summary.lore', `描述: ${loreText}`, { value: loreText }))
  }

  if (input.drinkmessage) {
    lines.push(t('summary.drinkmessage', `饮用消息: ${input.drinkmessage}`, { value: input.drinkmessage }))
  }
  if (input.glint) {
    lines.push(t('summary.glint', '发光: 是'))
  }

  if (input.effects && input.effects.length > 0) {
    const effectsText = input.effects
      .map((ef) => {
        const name =
          translate?.(`effects.names.${ef.id}`) ??
          (EFFECT_NAME_BY_ID.get(ef.id) ?? ef.id)
        const duration = INSTANT_EFFECTS.has(ef.id)
          ? ''
          : t('summary.effectDuration', `, ${ef.duration ?? 1}秒`, { value: ef.duration ?? 1 })
        return t('summary.effectItem', `${name}(等级${ef.level}${duration})`, {
          name,
          level: ef.level,
          duration,
        })
      })
      .join('; ')
    lines.push(t('summary.effects', `效果: ${effectsText}`, { value: effectsText }))
  }

  return lines
}
