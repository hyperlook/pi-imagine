# pi-imagine

给 `pi` 用的出图 / 改图扩展。默认 payload 对齐 Grok Build：`grok-imagine-image-quality` + `1k` + `b64_json`。模型、分辨率、quality 仍可由 Agent 按用户意图覆盖。

技能 `imagine` 打在本包里，随扩展一起加载，只在 Pi 装了这套工具时出现。不要拷到 `~/.agents/skills/`：那个目录是跨 Agent 通用技能，OpenCode 等没有 `image_gen` 的工具加载了也没用。

## 能力

- **`image_gen`**：文生图。可传 `aspect_ratio`、`resolution`（`1k`/`2k`）、`quality`（仅 2.0）、`model`、`output_path`。
- **`image_edit`**：按参考图改图，参数规则相同。
- **默认快档**：不传模型/分辨率时走 Grok Build 同款请求体，一次拿 base64，不再先拿 URL 再下载。
- **意图升档**：写在工具 schema 里。没点名就省略 knobs；用户要精细/海报/2k 时 Agent 按 schema 覆盖。
- **技能 `imagine`**：何时用代码画、怎么写 prompt、真人参考、多图一致性。不重复 schema 里的升档表。

## 工具

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

## 安装

写入 `~/.pi/agent/settings.json`：

```json
{
  "packages": [
    "../../github/pi-imagine"
  ]
}
```

若 `~/.agents/skills/imagine` 还在，Pi 会优先用那份并跳过包内技能。装了本包就删掉全局那份，避免撞名，也避免别的 Agent 加载一份废技能。
