<p align="center">
    <img src="https://github.com/meorionel/breweryx-recipes-generator/raw/main/public/logo.png" width="80" alt="BreweryX Recipes Generator" />
    <h2 align="center">BreweryX Recipes Generator</h2>
</p>

<p align="center">一个 BreweryX 的配方生成器</p>

## 简介

BreweryX Recipes Generator 是一个为 [BreweryX](https://github.com/BreweryTeam/BreweryX) 酿造插件生成配方的可视化工具。通过表单填写原料、酿造工艺、蒸馏、陈酿、效果等参数，一键生成可直接粘贴进 `recipes.yml` 的 YAML 配方代码，并附带人类可读的配方摘要。

## 功能特性

- **配方基础信息** — 自定义 key、品质系统（劣质 / 普通 / 优质），支持三种品质分别命名
- **原料选择** — 内置数百种 Minecraft 物品的中文 / 英文 ID 映射，支持搜索、添加多个原料及数量
- **酿造工艺** — 煮制时间、蒸馏次数 / 时间、木桶陈酿（可选 13 种木材类型）
- **外观定制** — 颜色（名称或 HEX）、难度、酒精度、自定义模型数据（CustomModelData）、发光特效
- **药水效果** — 数十种原版效果，支持等级 / 时长数值范围（如 `1-2`）
- **Lore 与命令** — 按品质区分的 Lore 行、服务器命令、玩家命令、饮用消息
- **实时校验** — 提交前校验必填项与数值范围，错误信息中英文提示
- **YAML 输出** — 生成格式正确的 BreweryX 配方代码，一键复制
- **多语言** — 界面支持中文与英文切换
- **明暗主题** — 支持跟随系统或手动切换明暗模式

## 技术栈

- [Bun](https://bun.sh/) — 运行时与打包
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Base UI](https://base-ui.com/) 组件库
- [i18next](https://www.i18next.com/) 国际化
- [next-themes](https://github.com/pacocoursey/next-themes) 主题切换

## 本地开发

```bash
# 安装依赖
bun install

# 启动开发服务器（含热更新）
bun run dev

# 生产构建
bun run build

# 运行生产服务器
bun run start
```

## 使用方法

1. 填写配方信息，如名称、原料、煮制时间等
2. 按需开启蒸馏、陈酿、品质与效果配置
3. 点击 **生成配方**，底部会展示配方摘要与 YAML 代码
4. 点击 **复制** 即可粘贴到 BreweryX 的 `recipes.yml` 中

## 许可证

本项目使用 GPLv3 许可证。
