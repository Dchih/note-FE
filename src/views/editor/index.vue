<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter, onBeforeRouteLeave } from "vue-router";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import ConfirmDialog from "../../components/ConfirmDialog.vue";
import AnimatedBackground from "../../components/AnimatedBackground.vue";
import { createEmptyContent } from "../../utils/storage";
import { notesApi } from "../../utils/api";

const route = useRoute();
const router = useRouter();

// 支持 "new" 作为新笔记标识
const paramId = route.params.id as string;
const isNewNote = ref(paramId === "new");
const noteId = ref(isNewNote.value ? Date.now() : Number(paramId));
const noteTitle = ref("");
const noteDate = ref("");
const noteColor = ref("#fff4e6");

// 跟踪是否有未保存的更改
const hasUnsavedChanges = ref(false);
const originalContent = ref<any>(null);
const originalTitle = ref("");
const isSaving = ref(false);
const showConfirmDialog = ref(false);
const pendingNavigation = ref<any>(null);

// 初始化编辑器
const isInitializing = ref(true); // 标记是否正在初始化

const editor = useEditor({
  extensions: [StarterKit],
  content: "",
  editorProps: {
    attributes: {
      class:
        "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none editor-content",
    },
  },
  onUpdate: () => {
    // 初始化完成后才标记为有更改
    if (!isInitializing.value) {
      console.log("编辑器内容已更改");
      hasUnsavedChanges.value = true;
    }
  },
});

// 从 API 加载笔记数据
onMounted(async () => {
  if (isNewNote.value) {
    // 新笔记
    noteTitle.value = "新笔记";
    noteDate.value = new Date().toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    if (editor.value) {
      const emptyContent = createEmptyContent();
      editor.value.commands.setContent(emptyContent);
      originalContent.value = JSON.stringify(emptyContent);
      originalTitle.value = noteTitle.value;
    }
  } else {
    // 从 API 加载已有笔记
    try {
      const note = await notesApi.getById(noteId.value);

      if (note) {
        noteTitle.value = note.title || "无标题";
        noteDate.value = note.createdAt
          ? new Date(note.createdAt).toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
          : new Date().toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            });
        noteColor.value = note.color || "#fff4e6";

        if (editor.value) {
          // API 返回的 content 是字符串，直接设置为 HTML
          editor.value.commands.setContent(note.content || "");
          originalContent.value = note.content || "";
          originalTitle.value = note.title || "";
        }
      }
    } catch (error) {
      console.error("加载笔记失败:", error);
      // 加载失败，当作新笔记处理
      noteTitle.value = "新笔记";
      noteDate.value = new Date().toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      if (editor.value) {
        const emptyContent = createEmptyContent();
        editor.value.commands.setContent(emptyContent);
        originalContent.value = JSON.stringify(emptyContent);
        originalTitle.value = noteTitle.value;
      }
    }
  }

  // 使用 setTimeout 确保内容加载完成后再重置
  setTimeout(() => {
    hasUnsavedChanges.value = false;
    isInitializing.value = false; // 初始化完成
  }, 100);
});

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});

// 保存笔记
const saveNoteData = async () => {
  if (!editor.value) return;

  // 验证标题不能为空
  if (!noteTitle.value.trim()) {
    alert("请输入笔记标题");
    return;
  }

  isSaving.value = true;

  try {
    const contentHTML = editor.value.getHTML(); // 获取 HTML 格式的内容

    const noteData = {
      title: noteTitle.value,
      content: contentHTML, // API 需要的是字符串格式
    };

    if (isNewNote.value) {
      // 新建笔记
      const result = await notesApi.create(noteData);
      console.log("创建笔记成功:", result);

      // 更新为已存在的笔记 ID（如果 API 返回了 ID）
      if (result.id) {
        noteId.value = result.id;
        isNewNote.value = false;
      }
    } else {
      // 更新已有笔记
      const result = await notesApi.update(noteId.value, noteData);
      console.log("更新笔记成功:", result);
    }

    // 标记为已保存
    hasUnsavedChanges.value = false;
    originalContent.value = contentHTML;
    originalTitle.value = noteTitle.value;

    // 保存后返回列表
    router.push("/home");
  } catch (error: any) {
    console.error("保存笔记失败:", error);
    alert(error.message || "保存失败，请稍后重试");
  } finally {
    isSaving.value = false;
  }
};

// 检测标题变化
const handleTitleChange = () => {
  if (!isInitializing.value && noteTitle.value !== originalTitle.value) {
    hasUnsavedChanges.value = true;
  }
};

// 返回列表
const goBack = () => {
  console.log("goBack 被调用，hasUnsavedChanges:", hasUnsavedChanges.value);

  if (hasUnsavedChanges.value) {
    // 有未保存更改，显示确认对话框
    console.log("显示确认对话框");
    showConfirmDialog.value = true;
    pendingNavigation.value = () => router.push("/home");
  } else {
    // 没有更改，直接返回
    console.log("没有更改，直接返回");
    router.push("/home");
  }
};

// 确认对话框 - 保存
const handleConfirmSave = () => {
  saveNoteData();
  showConfirmDialog.value = false;
};

// 确认对话框 - 放弃更改
const handleDiscardChanges = () => {
  hasUnsavedChanges.value = false;
  showConfirmDialog.value = false;
  if (pendingNavigation.value) {
    pendingNavigation.value();
    pendingNavigation.value = null;
  }
};

// 确认对话框 - 取消
const handleCancelDialog = () => {
  showConfirmDialog.value = false;
  pendingNavigation.value = null;
};

// 路由离开守卫
onBeforeRouteLeave((_to, _from, next) => {
  console.log(
    "路由守卫触发，isSaving:",
    isSaving.value,
    "hasUnsavedChanges:",
    hasUnsavedChanges.value
  );

  if (isSaving.value || !hasUnsavedChanges.value) {
    // 正在保存或没有更改，允许离开
    console.log("允许离开");
    next();
    return;
  }

  // 有未保存更改，显示确认对话框
  console.log("显示确认对话框，阻止导航");
  showConfirmDialog.value = true;
  pendingNavigation.value = () => next();

  // 先阻止导航
  next(false);
});
</script>

<template>
  <AnimatedBackground />
  <div class="editor-page">
    <!-- 顶部工具栏 -->
    <div class="editor-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn"><span>←</span> 返回</button>
        <input
          v-model="noteTitle"
          type="text"
          class="title-input"
          placeholder="笔记标题"
          @input="handleTitleChange"
        />
      </div>
      <div class="header-right">
        <span v-if="hasUnsavedChanges" class="unsaved-indicator">
          • 未保存
        </span>
        <span class="date-info">{{ noteDate }}</span>
        <button @click="saveNoteData" class="save-btn">保存</button>
      </div>
    </div>

    <!-- 编辑器工具栏 -->
    <div v-if="editor" class="editor-toolbar">
      <button
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor.isActive('bold') }"
        class="toolbar-btn"
      >
        <strong>B</strong>
      </button>
      <button
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor.isActive('italic') }"
        class="toolbar-btn"
      >
        <em>I</em>
      </button>
      <button
        @click="editor.chain().focus().toggleStrike().run()"
        :class="{ 'is-active': editor.isActive('strike') }"
        class="toolbar-btn"
      >
        <s>S</s>
      </button>
      <div class="toolbar-divider"></div>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
        class="toolbar-btn"
      >
        H1
      </button>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
        class="toolbar-btn"
      >
        H2
      </button>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
        class="toolbar-btn"
      >
        H3
      </button>
      <div class="toolbar-divider"></div>
      <button
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'is-active': editor.isActive('bulletList') }"
        class="toolbar-btn"
      >
        • 列表
      </button>
      <button
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'is-active': editor.isActive('orderedList') }"
        class="toolbar-btn"
      >
        1. 列表
      </button>
      <button
        @click="editor.chain().focus().toggleBlockquote().run()"
        :class="{ 'is-active': editor.isActive('blockquote') }"
        class="toolbar-btn"
      >
        " 引用
      </button>
      <div class="toolbar-divider"></div>
      <button
        @click="editor.chain().focus().undo().run()"
        :disabled="!editor.can().undo()"
        class="toolbar-btn"
      >
        ↶ 撤销
      </button>
      <button
        @click="editor.chain().focus().redo().run()"
        :disabled="!editor.can().redo()"
        class="toolbar-btn"
      >
        ↷ 重做
      </button>
    </div>

    <!-- 编辑器内容区 -->
    <div class="editor-wrapper" :style="{ backgroundColor: noteColor }">
      <EditorContent :editor="editor" class="editor-main" />
    </div>

    <!-- 确认对话框 -->
    <ConfirmDialog
      v-if="showConfirmDialog"
      title="未保存的更改"
      message="您有未保存的更改，是否保存？"
      confirm-text="保存"
      discard-text="放弃"
      cancel-text="取消"
      :show-discard="true"
      @confirm="handleConfirmSave"
      @discard="handleDiscardChanges"
      @cancel="handleCancelDialog"
    />
  </div>
</template>

<style scoped>
.editor-page {
  min-height: 100vh;
  position: relative;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.back-btn {
  padding: 8px 16px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.back-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.title-input {
  flex: 1;
  max-width: 400px;
  padding: 8px 16px;
  font-size: 18px;
  font-weight: 600;
  border: 2px solid transparent;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.title-input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.unsaved-indicator {
  font-size: 13px;
  color: #ff6b6b;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.date-info {
  font-size: 14px;
  color: #7f8c8d;
}

.save-btn {
  padding: 8px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.editor-toolbar {
  display: flex;
  gap: 4px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid #e0e0e0;
  flex-wrap: wrap;
  position: sticky;
  top: 73px;
  z-index: 9;
}

.toolbar-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s ease;
}

.toolbar-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #667eea;
}

.toolbar-btn.is-active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.toolbar-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e0e0e0;
  margin: 0 8px;
}

.editor-wrapper {
  max-width: 900px;
  margin: 24px auto;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  min-height: calc(100vh - 200px);
}

.editor-main {
  min-height: 400px;
}

/* 编辑器内容样式 */
:deep(.editor-content) {
  padding: 16px;
  min-height: 400px;
  line-height: 1.8;
  color: #2c3e50;
}

:deep(.editor-content h1) {
  font-size: 2em;
  font-weight: 700;
  margin: 1em 0 0.5em;
  color: #2c3e50;
}

:deep(.editor-content h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin: 0.8em 0 0.4em;
  color: #34495e;
}

:deep(.editor-content h3) {
  font-size: 1.2em;
  font-weight: 600;
  margin: 0.6em 0 0.3em;
  color: #34495e;
}

:deep(.editor-content p) {
  margin: 0.5em 0;
}

:deep(.editor-content ul),
:deep(.editor-content ol) {
  padding-left: 2em;
  margin: 0.5em 0;
}

:deep(.editor-content li) {
  margin: 0.3em 0;
}

:deep(.editor-content blockquote) {
  border-left: 4px solid #667eea;
  padding-left: 1em;
  margin: 1em 0;
  color: #7f8c8d;
  font-style: italic;
}

:deep(.editor-content code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  .header-left {
    width: 100%;
  }

  .title-input {
    max-width: 100%;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .editor-toolbar {
    padding: 8px 12px;
    top: 117px;
  }

  .editor-wrapper {
    margin: 16px;
    padding: 20px;
  }

  .toolbar-btn {
    padding: 4px 8px;
    font-size: 12px;
  }
}
</style>
