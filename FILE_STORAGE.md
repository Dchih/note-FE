# 📁 Tauri 文件系统存储说明

本项目已从浏览器 localStorage 迁移到 Tauri 文件系统存储，笔记数据保存在本地文件中。

## 📍 文件保存位置

### Windows
```
C:\Users\<用户名>\AppData\Roaming\com.dchih.demo\notes\all-notes.json
```

### macOS
```
~/Library/Application Support/com.dchih.demo/notes/all-notes.json
```

### Linux
```
~/.local/share/com.dchih.demo/notes/all-notes.json
```

## 📄 文件格式

笔记以 JSON 格式存储，所有笔记保存在一个文件中：

```json
[
  {
    "id": 1640000000000,
    "title": "我的第一条笔记",
    "content": {
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 2 },
          "content": [
            { "type": "text", "text": "标题" }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            { "type": "text", "text": "这是笔记内容" }
          ]
        }
      ]
    },
    "contentText": "标题 这是笔记内容",
    "date": "2025/12/21",
    "color": "#fff4e6",
    "updatedAt": 1640000000000
  }
]
```

## 🔧 技术实现

### 使用的 API

```typescript
import {
  writeTextFile,
  readTextFile,
  exists,
  mkdir,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";
```

### 核心功能

1. **初始化目录**
```typescript
await mkdir("notes", {
  baseDir: BaseDirectory.AppData,
  recursive: true,
});
```

2. **读取笔记**
```typescript
const content = await readTextFile("notes/all-notes.json", {
  baseDir: BaseDirectory.AppData,
});
const notes = JSON.parse(content);
```

3. **保存笔记**
```typescript
await writeTextFile(
  "notes/all-notes.json",
  JSON.stringify(notes, null, 2),
  { baseDir: BaseDirectory.AppData }
);
```

## 💾 数据备份

### 手动备份

1. 找到笔记文件位置（见上方路径）
2. 复制 `all-notes.json` 文件
3. 保存到安全的位置

### 恢复备份

1. 将备份的 `all-notes.json` 文件
2. 复制到应用数据目录的 `notes` 文件夹
3. 重启应用

## 🔄 从 localStorage 迁移

如果之前使用 localStorage 保存了数据：

1. **导出旧数据**
```javascript
// 在浏览器控制台执行
const oldData = localStorage.getItem('waterfall-notes');
console.log(oldData);
// 复制输出的 JSON 数据
```

2. **导入到文件**
- 将 JSON 数据保存为 `all-notes.json`
- 放到对应的应用数据目录

## ⚠️ 注意事项

### 文件权限

- ✅ 已配置 Tauri 文件系统权限（`fs:allow-app-*`）
- ✅ 仅允许访问应用数据目录（`AppData`）
- ✅ 不能访问系统其他位置（安全限制）

### 性能优化

- ✅ 使用内存缓存减少文件读取
- ✅ JSON 格式化存储（`null, 2`）方便手动编辑
- ✅ 原子写入，避免数据损坏

### 数据安全

- ✅ 自动创建目录
- ✅ 错误处理和日志记录
- ✅ 文件不存在时返回空数组
- ✅ 写入失败会抛出异常

## 🔍 查看文件内容

### Windows (PowerShell)
```powershell
notepad $env:APPDATA\com.dchih.demo\notes\all-notes.json
```

### macOS/Linux
```bash
cat ~/Library/Application\ Support/com.dchih.demo/notes/all-notes.json
# 或使用文本编辑器打开
```

## 📊 优势

与 localStorage 相比：

| 特性 | localStorage | Tauri 文件系统 |
|------|-------------|---------------|
| 存储位置 | 浏览器数据 | 系统文件 |
| 容量限制 | 5-10MB | 无限制 |
| 可读性 | 难以查看 | 可直接编辑 |
| 备份 | 困难 | 简单 |
| 跨应用 | 不可 | 可以 |
| 格式化 | 压缩 | 格式化 JSON |

## 🚀 下一步

可以进一步扩展：
- 📤 导出单个笔记为 Markdown
- 📥 导入外部 Markdown 文件
- 🔄 自动备份到云端
- 📊 数据统计和分析
- 🔐 加密敏感笔记

