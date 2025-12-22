# 便签瀑布流

一个基于 Vue 3 + TypeScript 的便签瀑布流应用，以记事本卡片形式展示内容，支持不固定高度和无限滚动加载。

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 核心特性

✅ **动态列数** - 固定卡片宽度（280px），根据窗口宽度自动调整列数（1-6 列）  
✅ **智能瀑布流** - 自动平衡各列高度  
✅ **富文本编辑** - 基于 TipTap 的强大富文本编辑器  
✅ **便签纸样式** - 精美的记事本卡片设计  
✅ **点击编辑** - 点击卡片即可进入编辑模式  
✅ **智能保存提示** - 离开编辑器时自动检测未保存更改  
✅ **不固定高度** - 根据内容自动调整高度  
✅ **无限滚动** - 触底自动加载更多便签  
✅ **随机颜色** - 每个便签有不同的背景色  
✅ **响应式设计** - 窗口大小变化时自动重排

## 实现原理

### 1. 动态列数计算

卡片宽度固定为 280px，根据窗口宽度自动计算可容纳的列数：

```typescript
const CARD_WIDTH = 280; // 固定卡片宽度
const GAP = 16; // 列间距

const calculateColumnCount = (): number => {
  const containerWidth =
    window.innerWidth > 1600 ? 1600 : window.innerWidth - 40;
  const availableWidth = containerWidth - 40;
  const columnWidth = CARD_WIDTH + GAP;
  const count = Math.floor((availableWidth + GAP) / columnWidth);
  return Math.max(1, Math.min(count, 6)); // 1-6列
};
```

### 2. 瀑布流布局算法

每次添加新项目时，选择当前高度最小的列插入：

```typescript
const getMinHeightColumnIndex = (): number => {
  let minHeight = columnHeights.value[0];
  let minIndex = 0;
  for (let i = 1; i < columnHeights.value.length; i++) {
    if (columnHeights.value[i] < minHeight) {
      minHeight = columnHeights.value[i];
      minIndex = i;
    }
  }
  return minIndex;
};
```

### 3. 窗口变化时重新分配

监听窗口大小变化，当列数改变时自动重新分配所有便签：

```typescript
window.addEventListener("resize", updateColumnCount);
```

### 无限滚动

监听 window scroll 事件，当距离底部 100px 时触发加载：

```typescript
const handleScroll = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  if (scrollTop + windowHeight >= documentHeight - 100) {
    loadMore();
  }
};
```

## 便签数据结构

```typescript
interface NoteItem {
  id: number;
  title: string;
  content: string;
  date: string;
  color: string;
}
```

便签颜色从预定义的柔和色调中随机选择，内容从预设的文本库中随机生成。

## 文件结构

```
src/
├── views/
│   └── home/
│       └── index.vue      # 便签瀑布流主页面（包含数据生成逻辑）
├── layout/
│   ├── index.vue
│   └── mian.vue          # 主布局
├── router/
│   └── index.ts          # 路由配置
└── main.ts
```

## UnoCSS 样式系统

本项目使用 UnoCSS 原子化 CSS 引擎，提供：

- ⚡️ 极快的构建速度
- 🎯 按需生成 CSS
- 🎨 灵活的样式定制
- 📱 简洁的响应式设计

查看详细使用说明：[UNOCSS_GUIDE.md](./UNOCSS_GUIDE.md)

## 使用说明

### 1. 首次使用

- 首次打开应用时，**没有任何笔记**
- 会**自动跳转到编辑器**，创建第一条笔记
- 编辑完成后点击**保存**，自动返回列表

### 2. 创建新笔记

- 在首页右上角点击**"+ 新建笔记"**按钮
- 进入编辑器，输入标题和内容
- 点击**保存**按钮，笔记会保存到本地存储并返回列表

### 3. 编辑已有笔记

- **点击任意笔记卡片**进入编辑页面
- 编辑器会**自动加载**该笔记的内容
- 编辑器支持：
  - ✍️ 富文本编辑（加粗、斜体、删除线）
  - 📝 多级标题（H1, H2, H3）
  - 📋 有序/无序列表
  - 💬 引用块
  - ↶↷ 撤销/重做
- 点击**保存**按钮保存更改并返回列表
- 点击**返回**按钮或尝试离开页面时：
  - 如果**有未保存更改**，会弹出确认对话框：
    - 点击**"保存"** - 保存更改并返回列表
    - 点击**"放弃"** - 放弃更改并返回列表
    - 点击**"取消"** - 留在编辑页面继续编辑
  - 如果**没有更改**，直接返回列表

### 4. 浏览笔记

- 在首页（`/home`）以瀑布流布局浏览所有笔记
- 列数根据窗口宽度自动调整（1-6 列）
- 每个卡片固定宽度 280px，高度根据内容自动调整
- 点击右上角**"+ 新建笔记"**创建新笔记

### 5. 智能保存提示

编辑器会自动跟踪更改：

- 编辑内容时自动标记为"有未保存更改"
- 修改标题时也会标记
- 离开页面时如果有未保存更改，会弹出精美的确认对话框
- 保存后自动清除未保存标记

### 6. 数据持久化

- ✅ 所有笔记保存到**本地文件系统**（使用 Tauri 文件 API）
- ✅ 富文本格式以 **JSON** 格式存储（TipTap 原生格式）
- ✅ 文件位置：`AppData/com.dchih.demo/notes/all-notes.json`
- ✅ 可以直接编辑 JSON 文件
- ✅ 方便备份和迁移
- ✅ 无容量限制（不同于 localStorage 的 5-10MB）

详细说明请查看：[FILE_STORAGE.md](./FILE_STORAGE.md)

## 数据存储说明

### 存储位置

笔记保存在系统应用数据目录：

- **Windows**: `C:\Users\<用户名>\AppData\Roaming\com.dchih.demo\notes\all-notes.json`
- **macOS**: `~/Library/Application Support/com.dchih.demo/notes/all-notes.json`
- **Linux**: `~/.local/share/com.dchih.demo/notes/all-notes.json`

### 存储格式

笔记数据以格式化的 JSON 文件存储：

```typescript
interface StoredNote {
  id: number;
  title: string;
  content: NoteContent; // TipTap JSON 格式
  contentText: string; // 纯文本预览（用于列表显示）
  date: string;
  color: string;
  updatedAt: number; // 更新时间戳
}
```

### 存储位置

- **Key**: `waterfall-notes`
- **位置**: `localStorage`（浏览器本地存储）
- **容量**: 通常 5-10MB（取决于浏览器）

### 文件内容示例

```json
[
  {
    "id": 1703145600000,
    "title": "我的笔记",
    "content": {
      "type": "doc",
      "content": [...]
    },
    "contentText": "笔记预览文本",
    "date": "2025/12/21",
    "color": "#fff4e6",
    "updatedAt": 1703145600000
  }
]
```

### 备份和恢复

- 💾 **备份**: 直接复制 `all-notes.json` 文件
- 🔄 **恢复**: 将备份文件放回原位置
- 📤 **导出**: 文件已经是标准 JSON，可以直接使用
- 📥 **导入**: 替换 JSON 文件即可

详细说明：[FILE_STORAGE.md](./FILE_STORAGE.md)

## 自定义便签内容

在 `index.vue` 中的 `generateRandomContent()` 函数里修改便签内容库，或在 `noteColors` 数组中自定义便签颜色。

## 性能优化建议

1. **防抖处理** - 对于频繁触发的滚动事件可添加防抖
2. **虚拟滚动** - 超大数据量时可考虑虚拟滚动
3. **预加载** - 调整触发阈值提前加载数据

## 技术栈

- Vue 3
- TypeScript
- Vite
- Vue Router
- UnoCSS - 原子化 CSS 引擎
- TipTap - 富文本编辑器
- Tauri - 桌面应用框架
- Tauri FS Plugin - 文件系统访问

## License

MIT
