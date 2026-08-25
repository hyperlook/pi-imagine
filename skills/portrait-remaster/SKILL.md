---
name: portrait-remaster
description: 将生活照/自拍重塑为专业摄影级大片（单反人像、电影写真、轻奢Ins、旅行大片、时尚杂志，以及原图专业调色光影精修）。
---

# Portrait Remaster 人像摄影重塑与调色

保持人物五官特征与真实皮肤质感，将普通照片重塑为专业摄影作品，或在保留原背景的前提下进行专业光影调色。

## 风格索引

根据用户需求读取对应风格文件获取英文 Prompt 模板：

| 模式 | 风格 | 风格文件 | 说明 |
| :--- | :--- | :--- | :--- |
| **1** (默认) | 单反专业人像 (DSLR) | `styles/1-dslr.md` | 85mm 定焦虚化与柔光，重塑单反质感 |
| **2** | 电影质感写真 (Cinematic) | `styles/2-cinematic.md` | 电影布光、胶片色彩与宽画幅叙事感 |
| **3** | 高级轻奢生活 (Luxury) | `styles/3-luxury.md` | 现代轻奢场景与高级审美生活方式 |
| **4** | 旅行摄影大片 (Travel) | `styles/4-travel.md` | 自然风光融合与旅行纪实质感 |
| **5** | 时尚杂志大片 (Magazine) | `styles/5-magazine.md` | 高定造型与影棚高级光影大片 |
| **6** | 原图调色光影精修 (Color Grading) | `styles/6-color-grading.md` | **不改背景与构图**，仅优化光影、肤色提亮、曝光平衡与色彩分级 |

## 工作流

1. 读取对应风格文件，获取完整的英文 Prompt 模板。
2. 将用户指定的场景/服装/色调细节填入 `[SCENE_DESC]` 或 `[COLOR_STYLE]`（未指定则用文件内的默认场景/色调）。
3. 调用 `image_edit(image=..., prompt=...)` 执行重绘。
