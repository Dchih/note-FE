/**
 * Tauri 文件系统存储工具
 */
import {
  writeTextFile,
  readTextFile,
  exists,
  mkdir,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";

export interface NoteContent {
  type: string;
  content?: any[];
  [key: string]: any;
}

export interface StoredNote {
  id: number;
  title: string;
  content: NoteContent; // TipTap JSON 格式
  contentText: string; // 纯文本预览
  date: string;
  color: string;
  updatedAt: number; // 更新时间戳
}

const NOTES_DIR = "notes"; // 笔记目录
const NOTES_FILE = "notes/all-notes.json"; // 所有笔记的文件
let notesCache: StoredNote[] | null = null; // 内存缓存

/**
 * 初始化笔记目录
 */
const initNotesDir = async (): Promise<void> => {
  try {
    const dirExists = await exists(NOTES_DIR, {
      baseDir: BaseDirectory.AppData,
    });

    if (!dirExists) {
      await mkdir(NOTES_DIR, {
        baseDir: BaseDirectory.AppData,
        recursive: true,
      });
      console.log("笔记目录已创建");
    }
  } catch (error) {
    console.error("初始化笔记目录失败:", error);
  }
};

/**
 * 读取笔记文件
 */
const readNotesFile = async (): Promise<StoredNote[]> => {
  try {
    const fileExists = await exists(NOTES_FILE, {
      baseDir: BaseDirectory.AppData,
    });

    if (!fileExists) {
      // 文件不存在，返回空数组
      return [];
    }

    const content = await readTextFile(NOTES_FILE, {
      baseDir: BaseDirectory.AppData,
    });

    const notes = JSON.parse(content);
    return notes;
  } catch (error) {
    console.error("读取笔记文件失败:", error);
    return [];
  }
};

/**
 * 写入笔记文件
 */
const writeNotesFile = async (notes: StoredNote[]): Promise<void> => {
  try {
    await initNotesDir();
    await writeTextFile(NOTES_FILE, JSON.stringify(notes, null, 2), {
      baseDir: BaseDirectory.AppData,
    });
    notesCache = notes; // 更新缓存
    console.log("笔记已保存到文件:", NOTES_FILE);
  } catch (error) {
    console.error("写入笔记文件失败:", error);
    throw error;
  }
};

/**
 * 获取所有笔记
 */
export const getAllNotes = async (): Promise<StoredNote[]> => {
  // 如果有缓存，直接返回
  if (notesCache !== null) {
    return notesCache;
  }

  try {
    const notes = await readNotesFile();
    notesCache = notes;
    return notes;
  } catch (error) {
    console.error("读取笔记失败:", error);
    return [];
  }
};

/**
 * 获取单个笔记
 */
export const getNoteById = async (id: number): Promise<StoredNote | null> => {
  const notes = await getAllNotes();
  return notes.find((note) => note.id === id) || null;
};

/**
 * 保存或更新笔记
 */
export const saveNote = async (note: StoredNote): Promise<void> => {
  try {
    const notes = await getAllNotes();
    const index = notes.findIndex((n) => n.id === note.id);

    note.updatedAt = Date.now();

    if (index >= 0) {
      // 更新现有笔记
      notes[index] = note;
    } else {
      // 添加新笔记
      notes.push(note);
    }

    await writeNotesFile(notes);
    console.log(`笔记 ${note.id} 已保存`);
  } catch (error) {
    console.error("保存笔记失败:", error);
    throw error;
  }
};

/**
 * 删除笔记
 */
export const deleteNote = async (id: number): Promise<void> => {
  try {
    const notes = await getAllNotes();
    const filtered = notes.filter((note) => note.id !== id);
    await writeNotesFile(filtered);
    console.log(`笔记 ${id} 已删除`);
  } catch (error) {
    console.error("删除笔记失败:", error);
    throw error;
  }
};

/**
 * 批量保存笔记
 */
export const saveAllNotes = async (notes: StoredNote[]): Promise<void> => {
  try {
    await writeNotesFile(notes);
  } catch (error) {
    console.error("批量保存笔记失败:", error);
    throw error;
  }
};

/**
 * 清空所有笔记
 */
export const clearAllNotes = async (): Promise<void> => {
  try {
    await writeNotesFile([]);
    console.log("所有笔记已清空");
  } catch (error) {
    console.error("清空笔记失败:", error);
    throw error;
  }
};

/**
 * 从 HTML 提取纯文本（用于预览）
 */
export const extractTextFromHTML = (html: string): string => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

/**
 * 生成默认的空笔记内容
 */
export const createEmptyContent = (): NoteContent => {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "开始编辑你的笔记...",
          },
        ],
      },
    ],
  };
};
