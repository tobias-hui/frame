"use client";

import { Keyboard, X } from "lucide-react";
import { useState } from "react";

interface ShortcutItem {
  shortcut: string;
  description: string;
}

const shortcuts: ShortcutItem[] = [
  { shortcut: "Click", description: "选中元素" },
  { shortcut: "Drag", description: "拖拽元素" },
  { shortcut: "Double-click (Text)", description: "编辑文本" },
  { shortcut: "Delete / Backspace", description: "删除选中元素" },
  { shortcut: "Ctrl+C / Cmd+C", description: "复制" },
  { shortcut: "Ctrl+V / Cmd+V", description: "粘贴" },
  { shortcut: "Ctrl+D / Cmd+D", description: "复制" },
  { shortcut: "Ctrl+[", description: "下移一层" },
  { shortcut: "Ctrl+]", description: "上移一层" },
  { shortcut: "Ctrl+Shift+[", description: "移到最后" },
  { shortcut: "Ctrl+Shift+]", description: "移到最前" },
  { shortcut: "Escape", description: "取消选择 / 关闭编辑" },
];

export function KeyboardShortcutsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-lg transition-colors hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        title="查看快捷键"
      >
        <Keyboard className="h-4 w-4" />
        <span>快捷键</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/50">
          <div className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl dark:bg-zinc-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">键盘快捷键</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-6 py-4">
              <div className="space-y-3">
                {shortcuts.map((item) => (
                  <div key={item.shortcut} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {item.description}
                    </span>
                    <kbd className="whitespace-nowrap rounded border border-zinc-300 bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                      {item.shortcut}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
