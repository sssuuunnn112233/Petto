# TabBar 图标说明

## 需要的图标文件

请准备以下图标文件（尺寸：81px × 81px，格式：PNG）：

### 1. 游戏图标
- `game.png` - 未选中状态（灰色）
- `game-active.png` - 选中状态（绿色）
- 建议图标：🎮 游戏手柄

### 2. 社区图标
- `community.png` - 未选中状态（灰色）
- `community-active.png` - 选中状态（绿色）
- 建议图标：💬 对话气泡

### 3. 宠物图标
- `pet.png` - 未选中状态（灰色）
- `pet-active.png` - 选中状态（绿色）
- 建议图标：🐾 爪印或 🐶 狗狗

### 4. 消息图标
- `message.png` - 未选中状态（灰色）
- `message-active.png` - 选中状态（绿色）
- 建议图标：🔔 铃铛

### 5. 我的图标
- `profile.png` - 未选中状态（灰色）
- `profile-active.png` - 选中状态（绿色）
- 建议图标：👤 用户头像

## 图标获取方式

### 方式 1：使用 Iconfont（推荐）
1. 访问 https://www.iconfont.cn/
2. 搜索对应图标
3. 下载 PNG 格式（81px × 81px）
4. 准备两个版本：灰色（#666666）和绿色（#07c160）

### 方式 2：使用 Figma/Sketch 设计
1. 创建 81px × 81px 画布
2. 设计图标
3. 导出为 PNG 格式

### 方式 3：使用在线工具
- https://www.flaticon.com/
- https://icons8.com/
- https://www.iconfinder.com/

## 临时方案

如果暂时没有图标，可以：
1. 使用纯色方块作为占位符
2. 使用 emoji 表情（但效果不佳）
3. 先不配置图标，只显示文字

## 配置示例

```json
{
  "pagePath": "pages/pet/index",
  "text": "宠物页",
  "iconPath": "assets/tabbar/pet.png",
  "selectedIconPath": "assets/tabbar/pet-active.png"
}
```
