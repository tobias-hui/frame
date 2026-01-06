"use client";

import { ChevronDown, ChevronLast, ChevronUp, Copy, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCanvasStore } from "@/lib/store/canvas-store";

interface ContextMenuProps {
  onclose?: () => void;
}

interface MenuItem {
  label?: string;
  icon?: React.ReactNode;
  action?: () => void;
  shortcut?: string;
  separator?: boolean;
}

export function ContextMenu({ onclose }: ContextMenuProps) {
  const { selectedIds, getElement } = useCanvasStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();

      // Check if right-clicked on an element
      const target = e.target as HTMLElement;
      const elementId = target.getAttribute("data-element-id");

      if (elementId) {
        const element = getElement(elementId);
        if (element && !selectedIds.includes(elementId)) {
          useCanvasStore.getState().setSelectedIds([elementId]);
        }
      }

      setPosition({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };

    const handleClick = () => {
      setVisible(false);
      onclose?.();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", handleClick);
    };
  }, [getElement, selectedIds, onclose]);

  // Close menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setVisible(false);
        onclose?.();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onclose]);

  if (!visible || selectedIds.length === 0) {
    return null;
  }

  const state = useCanvasStore.getState();

  const menuItems: MenuItem[] = [
    {
      label: "复制",
      icon: <Copy className="h-4 w-4" />,
      action: () => state.copyElements(selectedIds),
      shortcut: "Ctrl+C",
    },
    {
      label: "粘贴",
      icon: <Copy className="h-4 w-4" />,
      action: () => state.pasteElements(),
      shortcut: "Ctrl+V",
    },
    {
      label: "复制",
      icon: <Copy className="h-4 w-4" />,
      action: () => state.duplicateElements(selectedIds),
      shortcut: "Ctrl+D",
    },
    { separator: true },
    {
      label: "移到最前",
      icon: <ChevronLast className="h-4 w-4 rotate-180" />,
      action: () => {
        for (const id of selectedIds) {
          state.bringToFront(id);
        }
      },
      shortcut: "Ctrl+Shift+]",
    },
    {
      label: "上移一层",
      icon: <ChevronUp className="h-4 w-4" />,
      action: () => {
        for (const id of selectedIds) {
          state.moveLayer(id, "up");
        }
      },
      shortcut: "Ctrl+]",
    },
    {
      label: "下移一层",
      icon: <ChevronDown className="h-4 w-4" />,
      action: () => {
        for (const id of selectedIds) {
          state.moveLayer(id, "down");
        }
      },
      shortcut: "Ctrl+[",
    },
    {
      label: "移到最后",
      icon: <ChevronLast className="h-4 w-4" />,
      action: () => {
        for (const id of selectedIds) {
          state.sendToBack(id);
        }
      },
      shortcut: "Ctrl+Shift+[",
    },
    { separator: true },
    {
      label: "删除",
      icon: <Trash2 className="h-4 w-4" />,
      action: () => {
        for (const id of selectedIds) {
          state.deleteElement(id);
        }
        state.setSelectedIds([]);
      },
      shortcut: "Delete",
    },
  ];

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Context menu needs to stop propagation
    // biome-ignore lint/a11y/useKeyWithClickEvents: Context menu is closed on click outside
    <div
      ref={menuRef}
      className="fixed z-[10001] min-w-[200px] rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 dark:bg-zinc-800 dark:ring-white/10"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => {
        if (item.separator) {
          return (
            <div
              key={`separator-${index}-${item.label ?? "sep"}`}
              className="my-1 border-t border-zinc-200 dark:border-zinc-700"
            />
          );
        }

        return (
          <button
            type="button"
            key={item.label ?? `separator-${index}`}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
            onClick={() => {
              item.action?.();
              setVisible(false);
              onclose?.();
            }}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
