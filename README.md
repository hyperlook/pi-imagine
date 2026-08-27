# pi-imagine

给 `pi` 用的生图、改图与高质量提示词检索扩展。默认 payload 对齐 Grok Build：`grok-imagine-image-quality` + `1k` + `b64_json`。模型、分辨率、quality 仍可由 Agent 按用户意图覆盖。

技能 `imagine` 打在本包里，随扩展一起加载，只在 Pi 装了这套工具时出现。内置 529+ 经过实测的高质量提示词画廊数据，供 Agent 快速检索最佳视觉范式并一键出图。

## 能力

- **`search_prompt_cases`**：在 529+ 个实测黄金案例中按关键词、大类（UI、海报、电商、3D、写实、插画等）、风格与场景检索。返回包含材质、光学折射、排版规范和变量插槽（如 `[PRODUCT]`, `[COUNTRY]`）的完整 Prompt。
- **`image_gen`**：文生图。可传 `aspect_ratio`、`resolution`（`1k`/`2k`）、`quality`（仅 2.0）、`model`、`output_path`。
- **`image_edit`**：按参考图改图，参数规则相同。
- **默认快档**：不传模型/分辨率时走 Grok Build 同款请求体，一次拿 base64，不再先拿 URL 再下载。
- **意图升档**：写在工具 schema 里。没点名就省略 knobs；用户要精细/海报/2k 时 Agent 按 schema 覆盖。
- **技能 `imagine` & `portrait-remaster`**：内置通用视觉工作流与专业人像重塑（分风格按需精准加载）技能。
- **快捷模板 `prompts/`**：包含 `/photo-remaster` 等开箱即用的高频生图/改图指令。

## 工具

### `search_prompt_cases`

检索高质量提示词案例：

```json
{
  "query": "水晶 海报 旅行",
  "category": "Posters & Typography",
  "limit": 3
}
```

### `image_gen`

日常出图只传 prompt（加比例）：

```json
{
  "prompt": "白底中央一颗红苹果，柔和棚拍",
  "aspect_ratio": "1:1"
}
```

用户要海报级画质时再升档：

```json
{
  "prompt": "赛博朋克夜市，霓虹雨，电影光",
  "aspect_ratio": "16:9",
  "model": "grok-imagine-image-2.0",
  "quality": "medium",
  "resolution": "2k"
}
```

### `image_edit`

```json
{
  "prompt": "改成黄金时段夕阳光，楼宇加上霓虹招牌",
  "image": "./output/cyberpunk.jpg"
}
```

## 快捷指令 (Prompt Templates)

本扩展内置快捷指令，随包自动加载：

- **`/photo-remaster`**：将普通生活照/自拍重塑为摄影级大片（支持单反人像、电影写真、轻奢Ins、旅行大片、时尚杂志，以及保留原图背景的专业光影调色 6 种模式）。
  - 用法示例：
    - 默认单反人像：`/photo-remaster`
    - 电影写真：`/photo-remaster 2 "cyberpunk neon cafe"`
    - 原地调色提亮：`/photo-remaster 6 "warm golden hour film tone" ./my_photo.jpg`
    - 旅行大片：`/photo-remaster 4 "Kyoto street in autumn with kimono" ./my_photo.jpg`

## 安装

### 方式 1：CLI 一键安装（推荐）

由于是私人仓库，推荐使用 SSH 方式（自动使用本地 SSH Key）：

```bash
# 全局安装（写入 ~/.pi/agent/settings.json）
pi install git:git@github.com:hyperlook/pi-imagine

# 或 HTTPS 方式（需配置好 GitHub 凭据）
pi install https://github.com/hyperlook/pi-imagine
```

临时体验（单次运行加载）：
```bash
pi -e git:git@github.com:hyperlook/pi-imagine
```

### 方式 2：本地路径安装

```bash
pi install /path/to/pi-imagine
```

或直接在 `~/.pi/agent/settings.json` 中配置：

```json
{
  "packages": [
    "../../github/pi-imagine"
  ]
}
```

> **提示**：若 `~/.agents/skills/imagine` 还在，Pi 会优先使用那份并跳过包内技能。装了本包建议删掉全局旧技能目录，避免撞名。
