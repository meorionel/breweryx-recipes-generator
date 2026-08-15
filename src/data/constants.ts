export const COLORS = new Set([
  'DARK_RED',
  'RED',
  'BRIGHT_RED',
  'ORANGE',
  'YELLOW',
  'PINK',
  'PURPLE',
  'BLUE',
  'CYAN',
  'WATER',
  'TEAL',
  'OLIVE',
  'GREEN',
  'LIME',
  'BLACK',
  'GREY',
  'BRIGHT_GREY',
  'WHITE',
])

export const HEX_COLOR = /^[0-9a-fA-F]{6}$/
export const ITEM_ID_RE = /^[A-Za-z0-9_:.-]+$/

export const KEY_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
export const KEY_LENGTH = 10

export type WoodOption = { value: number; label: string }

export const WOOD_OPTIONS: WoodOption[] = [
  { value: 0, label: '0 - 任意木材' },
  { value: 1, label: '1 - 白桦' },
  { value: 2, label: '2 - 橡木' },
  { value: 3, label: '3 - 丛林' },
  { value: 4, label: '4 - 云杉' },
  { value: 5, label: '5 - 金合欢' },
  { value: 6, label: '6 - 深色橡木' },
  { value: 7, label: '7 - 绯红' },
  { value: 8, label: '8 - 诡异' },
  { value: 9, label: '9 - 红树' },
  { value: 10, label: '10 - 樱花' },
  { value: 11, label: '11 - 竹子' },
  { value: 12, label: '12 - 切制铜' },
]

export const WOOD_MIN = 0
export const WOOD_MAX = 12
export const DIFFICULTY_MIN = 1
export const DIFFICULTY_MAX = 10
export const ALCOHOL_MIN = -100
export const ALCOHOL_MAX = 100
export const EFFECT_LEVEL_MIN = 1
export const EFFECT_LEVEL_MAX = 255
export const EFFECT_DURATION_MIN = 1
export const EFFECT_DURATION_MAX = 1638
export const INGREDIENT_AMOUNT_MIN = 1
export const INGREDIENT_AMOUNT_MAX = 99999
