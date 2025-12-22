<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, nextTick } from "vue";
import { useRouter } from "vue-router";
// import AnimatedBackground from "../../components/AnimatedBackground.vue";

const router = useRouter();

import { notesApi } from "../../utils/api";

interface NoteItem {
  id: number;
  title: string;
  content: string; // 用于列表显示的纯文本
  date?: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 动态列数（根据窗口宽度自动计算）
const CARD_WIDTH = 280; // 固定卡片宽度
const GAP = 16; // 列间距
const columnCount = ref(3);
const columns = ref<NoteItem[][]>([[], [], []]);
const columnHeights = ref<number[]>([0, 0, 0]);
const loading = ref(false);
const hasMore = ref(true);
const currentPage = ref(0);
const isFirstLoad = ref(true); // 标记是否首次加载

// 初始化列
const initColumns = (count: number) => {
  columns.value = Array.from({ length: count }, () => []);
  columnHeights.value = Array(count).fill(0);
};

// 根据窗口宽度计算可以容纳的列数
const calculateColumnCount = (): number => {
  const containerWidth =
    window.innerWidth > 1600 ? 1600 : window.innerWidth - 40; // 减去 padding
  const availableWidth = containerWidth - 40; // 减去容器左右 padding
  const columnWidth = CARD_WIDTH + GAP;
  const count = Math.floor((availableWidth + GAP) / columnWidth);
  return Math.max(1, Math.min(count, 6)); // 最少1列，最多6列
};

// 更新列数
const updateColumnCount = () => {
  const newCount = calculateColumnCount();
  if (newCount !== columnCount.value) {
    columnCount.value = newCount;
    redistributeNotes();
  }
};

// 重新分配所有便签到新的列数
const redistributeNotes = () => {
  // 收集所有现有的便签
  const allNotes: NoteItem[] = [];
  columns.value.forEach((column) => {
    allNotes.push(...column);
  });

  // 按 id 排序以保持顺序
  allNotes.sort((a, b) => a.id - b.id);

  // 重新初始化列
  initColumns(columnCount.value);

  // 重新分配
  allNotes.forEach((note) => {
    const minColIndex = getMinHeightColumnIndex();
    columns.value[minColIndex].push(note);
    const estimatedHeight = 100 + note.content.length * 0.5;
    columnHeights.value[minColIndex] += estimatedHeight + 16;
  });
};

// 从 API 加载笔记列表
const loadNotesFromApi = async (): Promise<NoteItem[]> => {
  try {
    const response = await notesApi.getList();
    // 假设 API 返回的数据格式为 { data: [...notes] } 或直接是数组
    const notes = Array.isArray(response) ? response : response.data || [];

    return notes.map((note: any) => ({
      id: note.id,
      title: note.title || "无标题",
      content: note.content ? note.content.substring(0, 150) : "",
      date: note.createdAt
        ? new Date(note.createdAt).toLocaleDateString("zh-CN")
        : new Date().toLocaleDateString("zh-CN"),
      color: note.color || "#fff4e6",
    }));
  } catch (error) {
    console.error("加载笔记列表失败:", error);
    throw error;
  }
};

// 找出当前高度最小的列
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

// 加载笔记数据
const loadMore = async () => {
  if (loading.value || !hasMore.value) return;

  loading.value = true;

  try {
    // 只在第一次加载时从 API 读取
    if (currentPage.value === 0) {
      const apiNotes = await loadNotesFromApi();

      if (apiNotes.length === 0) {
        // 没有数据，跳转到编辑器创建第一条笔记
        loading.value = false;
        router.push("/editor/new");
        return;
      }

      // 将数据分配到列中
      for (const note of apiNotes) {
        await nextTick();
        const minColIndex = getMinHeightColumnIndex();
        columns.value[minColIndex].push(note);

        const estimatedHeight = 100 + note.content.length * 0.5;
        columnHeights.value[minColIndex] += estimatedHeight + 16;
      }

      hasMore.value = false; // API 数据一次性加载完
      currentPage.value++;
    }
  } catch (error) {
    console.error("加载笔记失败:", error);
    hasMore.value = false;
  } finally {
    loading.value = false;
  }
};

// 监听滚动事件
const handleScroll = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  // 距离底部100px时触发加载
  if (scrollTop + windowHeight >= documentHeight - 100) {
    loadMore();
  }
};

const handleNoteClick = (note: NoteItem) => {
  // 跳转到编辑页面
  router.push(`/editor/${note.id}`);
};

// 创建新笔记
const createNewNote = () => {
  router.push("/editor/new");
};

// 重新加载列表数据
const reloadNotes = async () => {
  // 清空现有数据
  columns.value = Array.from({ length: columnCount.value }, () => []);
  columnHeights.value = Array(columnCount.value).fill(0);
  currentPage.value = 0;
  hasMore.value = true;
  loading.value = false;

  // 重新加载
  await loadMore();
};

onMounted(() => {
  // 初始化列数
  updateColumnCount();
  loadMore();

  // 监听滚动和窗口大小变化
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("resize", updateColumnCount);
});

// 当组件被 keep-alive 激活时重新加载数据
onActivated(() => {
  // 跳过首次加载（首次由 onMounted 处理）
  if (isFirstLoad.value) {
    isFirstLoad.value = false;
    return;
  }

  // 从编辑器返回时重新加载数据
  reloadNotes();
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("resize", updateColumnCount);
});
</script>

<template>
  <!-- <AnimatedBackground /> -->
  <div class="waterfall-container">
    <!-- 新建笔记按钮 -->
    <div class="header-actions">
      <button @click="createNewNote" class="create-btn">新建笔记</button>
    </div>

    <div class="waterfall-wrapper">
      <div
        v-for="(column, colIndex) in columns"
        :key="colIndex"
        class="waterfall-column"
      >
        <div
          v-for="note in column"
          :key="note.id"
          class="note-card"
          :style="{ backgroundColor: note.color }"
          @click="handleNoteClick(note)"
        >
          <div class="note-header">
            <h3 class="note-title">{{ note.title }}</h3>
            <span class="note-date">{{ note.date }}</span>
          </div>
          <div class="note-content">
            {{ note.content }}
          </div>
          <div class="note-footer">
            <div class="note-lines"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="loading-container">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="!hasMore" class="no-more">没有更多数据了</div>
    </div>
  </div>
</template>

<style scoped>
.waterfall-container {
  padding: 20px;
  min-height: 100vh;
  position: relative;
}

/* 头部操作区 */
.header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.create-btn:active {
  transform: translateY(0);
}

.create-icon {
  font-size: 24px;
  line-height: 1;
  font-weight: 300;
}

.waterfall-wrapper {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: center;
}

.waterfall-column {
  width: 280px; /* 固定宽度 */
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 便签纸样式 */
.note-card {
  break-inside: avoid;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  cursor: pointer;
  font-family: "Microsoft YaHei", -apple-system, sans-serif;
}

.note-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    transparent calc(100% - 1px),
    rgba(0, 0, 0, 0.05) calc(100% - 1px),
    rgba(0, 0, 0, 0.05) 100%
  );
  background-size: 100% 24px;
  pointer-events: none;
  opacity: 0.3;
}

.note-card:hover {
  transform: translateY(-4px) rotate(0.5deg);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.15);
}

.note-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  letter-spacing: 0.5px;
}

.note-date {
  font-size: 12px;
  color: #7f8c8d;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.6);
  padding: 2px 8px;
  border-radius: 10px;
}

.note-content {
  font-size: 14px;
  line-height: 1.8;
  color: #34495e;
  margin-bottom: 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
  user-select: none;
  position: relative;
  z-index: 1;
}

.note-footer {
  margin-top: auto;
  padding-top: 8px;
}

.note-lines {
  height: 1px;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(0, 0, 0, 0.1) 20%,
    rgba(0, 0, 0, 0.1) 80%,
    transparent 100%
  );
}

.loading-container {
  text-align: center;
  padding: 20px;
  margin-top: 20px;
}

.loading,
.no-more {
  color: #7f8c8d;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .waterfall-container {
    padding: 12px;
  }

  .header-actions {
    margin-bottom: 16px;
  }

  .create-btn {
    padding: 10px 20px;
    font-size: 14px;
  }

  .waterfall-wrapper {
    gap: 12px;
  }

  .waterfall-column {
    width: 100%; /* 小屏幕时占满宽度 */
    gap: 12px;
  }

  .note-card {
    padding: 12px;
  }

  .note-title {
    font-size: 16px;
  }

  .note-content {
    font-size: 13px;
  }
}
</style>
