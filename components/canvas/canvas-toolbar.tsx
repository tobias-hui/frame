"use client";

import { useCanvasStore } from "@/lib/store/canvas-store";

interface CanvasToolbarProps {
  className?: string;
}

export function CanvasToolbar({ className }: CanvasToolbarProps) {
  const { addElement, clearCanvas } = useCanvasStore();

  // Helper to add element at a default position
  const addTextElement = () => {
    addElement({
      type: "text",
      content: "Double-click to edit",
      style: {
        left: "100px",
        top: "100px",
        width: "200px",
        height: "50px",
        fontSize: "16px",
        color: "#000000",
        textAlign: "center",
      },
    });
  };

  const addImageElement = () => {
    addElement({
      type: "image",
      src: "https://via.placeholder.com/300x200",
      style: {
        left: "150px",
        top: "150px",
        width: "300px",
        height: "200px",
        borderRadius: "8px",
      },
    });
  };

  const addShapeElement = () => {
    addElement({
      type: "shape",
      style: {
        left: "200px",
        top: "200px",
        width: "150px",
        height: "150px",
        backgroundColor: "#3b82f6",
        borderRadius: "8px",
      },
    });
  };

  const addRectangleElement = () => {
    addElement({
      type: "shape",
      style: {
        left: "250px",
        top: "250px",
        width: "200px",
        height: "150px",
        backgroundColor: "#10b981",
        borderRadius: "0px",
      },
    });
  };

  const addCircleElement = () => {
    addElement({
      type: "shape",
      style: {
        left: "300px",
        top: "300px",
        width: "150px",
        height: "150px",
        backgroundColor: "#f59e0b",
        borderRadius: "50%",
      },
    });
  };

  const addContainerElement = () => {
    addElement({
      type: "container",
      style: {
        left: "350px",
        top: "150px",
        width: "400px",
        height: "300px",
        borderRadius: "8px",
      },
    });
  };

  const addButtonElement = () => {
    addElement({
      type: "button",
      content: "Click me",
      style: {
        left: "400px",
        top: "200px",
        width: "120px",
        height: "40px",
        backgroundColor: "#3b82f6",
        borderRadius: "8px",
      },
    });
  };

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg bg-white/90 p-2 shadow-lg backdrop-blur-sm dark:bg-zinc-800/90 ${className}`}
    >
      <div className="border-b border-zinc-200 pb-2 dark:border-zinc-700">
        <p className="px-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          Add Element
        </p>
      </div>

      <button
        onClick={addTextElement}
        className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
        title="Add text element"
      >
        <span className="text-lg">T</span>
        <span>Text</span>
      </button>

      <button
        onClick={addImageElement}
        className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
        title="Add image element"
      >
        <span className="text-lg">🖼️</span>
        <span>Image</span>
      </button>

      <button
        onClick={addShapeElement}
        className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
        title="Add shape element"
      >
        <span className="text-lg">⬜</span>
        <span>Shape</span>
      </button>

      <button
        onClick={addRectangleElement}
        className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
        title="Add rectangle"
      >
        <span className="text-lg">▭</span>
        <span>Rectangle</span>
      </button>

      <button
        onClick={addCircleElement}
        className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
        title="Add circle"
      >
        <span className="text-lg">⚪</span>
        <span>Circle</span>
      </button>

      <button
        onClick={addContainerElement}
        className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
        title="Add container"
      >
        <span className="text-lg">📦</span>
        <span>Container</span>
      </button>

      <button
        onClick={addButtonElement}
        className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
        title="Add button"
      >
        <span className="text-lg">🔘</span>
        <span>Button</span>
      </button>

      <div className="border-t border-zinc-200 pt-2 dark:border-zinc-700">
        <button
          onClick={clearCanvas}
          className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          title="Clear canvas"
        >
          <span>🗑️</span>
          <span>Clear All</span>
        </button>
      </div>
    </div>
  );
}
