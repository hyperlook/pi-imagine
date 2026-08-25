---
description: 将生活照/自拍重塑为摄影级大片或专业调色
argument-hint: "[style_id: 1-6] [scene/color description] [image_path]"
---
请使用 `portrait-remaster` 技能将输入照片重塑为摄影大片。

- 目标风格模式：${1:-1}（1: 单反专业人像, 2: 电影质感写真, 3: 高级轻奢生活, 4: 旅行摄影大片, 5: 时尚杂志大片, 6: 原图调色光影精修）
- 自定义场景/色调细节：${2:-使用该风格的默认推荐场景与光影}
- 输入图片：${3:-请从上下文寻找最近的图片或提示用户提供图片}

执行步骤：
1. 参考 `skills/portrait-remaster/SKILL.md`，读取对应的 `styles/` 文件获取 Prompt 模板。
2. 结合自定义描述完成提示词拼接。
3. 调用 `image_edit` 完成重绘输出。
