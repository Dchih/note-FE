import { defineConfig, presetUno, presetAttributify } from "unocss";

export default defineConfig({
  presets: [presetUno(), presetAttributify()],
  shortcuts: {
    // 容器快捷方式
    "waterfall-container":
      "max-w-1200px mx-auto p-20px bg-gradient-to-br from-[#f5f7fa] to-[#c3cfe2] min-h-screen",
    "waterfall-wrapper": "flex gap-16px items-start",
    "waterfall-column": "flex-1 flex flex-col gap-16px",

    // 便签卡片快捷方式
    "note-card-base":
      "p-16px rounded-4px relative cursor-default border-l-4 border-l-black/10 transition-all duration-300",
    "note-shadow":
      "shadow-[0_2px_4px_rgba(0,0,0,0.1),0_4px_8px_rgba(0,0,0,0.05)]",
    "note-shadow-hover":
      "shadow-[0_6px_12px_rgba(0,0,0,0.15),0_8px_16px_rgba(0,0,0,0.1)]",

    // 便签头部
    "note-header":
      "flex justify-between items-center mb-12px pb-8px border-b border-b-dashed border-b-black/15",
    "note-title": "m-0 text-18px font-600 text-[#2c3e50] tracking-0.5px",
    "note-date":
      "text-12px text-[#7f8c8d] font-500 bg-white/60 px-8px py-2px rounded-10px",

    // 便签内容
    "note-content":
      "text-14px leading-1.8 text-[#34495e] mb-12px whitespace-pre-wrap break-words select-none relative z-1",
    "note-footer": "mt-auto pt-8px",
    "note-lines":
      "h-1px bg-gradient-to-r from-transparent via-black/10 to-transparent",

    // 加载状态
    "loading-container": "text-center p-20px mt-20px",
    "loading-status":
      "text-[#7f8c8d] text-14px bg-white/80 px-16px py-8px rounded-20px inline-block shadow-[0_2px_4px_rgba(0,0,0,0.1)]",
  },
  rules: [
    // 自定义规则
    [
      /^font-(.+)$/,
      ([, d]) => ({ "font-family": `"${d}", -apple-system, sans-serif` }),
    ],
  ],
});
