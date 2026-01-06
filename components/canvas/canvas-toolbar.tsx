"use client";

import { useCanvasStore } from "@/lib/store/canvas-store";

interface CanvasToolbarProps {
  className?: string;
}

export function CanvasToolbar({ className }: CanvasToolbarProps) {
  const { addElement, clearCanvas } = useCanvasStore();

  const addTextElement = () => {
    addElement({
      type: "text",
      content: "Double-click to edit",
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      fontSize: "16px",
      color: "#000000",
      textAlign: "center",
    });
  };

  const addImageElement = () => {
    addElement({
      type: "image",
      src: "https://via.placeholder.com/300x200",
      x: 150,
      y: 150,
      width: 300,
      height: 200,
      borderRadius: "8px",
    });
  };

  const addShapeElement = () => {
    addElement({
      type: "shape",
      x: 200,
      y: 200,
      width: 150,
      height: 150,
      backgroundColor: "#3b82f6",
      borderRadius: "8px",
    });
  };

  const addRectangleElement = () => {
    addElement({
      type: "shape",
      x: 250,
      y: 250,
      width: 200,
      height: 150,
      backgroundColor: "#10b981",
      borderRadius: "0px",
    });
  };

  const addCircleElement = () => {
    addElement({
      type: "shape",
      x: 300,
      y: 300,
      width: 150,
      height: 150,
      backgroundColor: "#f59e0b",
      borderRadius: "50%",
    });
  };

  const addContainerElement = () => {
    addElement({
      type: "container",
      x: 350,
      y: 150,
      width: 400,
      height: 300,
      borderRadius: "8px",
    });
  };

  const addButtonElement = () => {
    addElement({
      type: "button",
      content: "Click me",
      x: 400,
      y: 200,
      width: 120,
      height: 40,
      backgroundColor: "#3b82f6",
      borderRadius: "8px",
    });
  };

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg bg-white/90 p-2 shadow-lg backdrop-blur-sm dark:bg-zinc-800/90 ${className}`}
    >
      <div className="border-b border-zinc-200 pb-2 dark:border-zinc-700">
        <p className="px-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">Add Element</p>
      </div>

      <button
        type="button"
        onClick={addTextElement}
        className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
        title="Add text element"
      >
        <span className="text-lg">T</span>
        <span>Text</span>
      </button>

      <button
        type="button"
        onClick={addImageElement}
        className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
        title="Add image element"
      >
        <span className="text-lg">🖼️</span>
        <span>Image</span>
      </button>

      <button
        type="button"
        onClick={addShapeElement}
        className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
        title="Add shape element"
      >
        <span className="text-lg">⬜</span>
        <span>Shape</span>
      </button>

      <button
        type="button"
        onClick={addRectangleElement}
        className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
        title="Add rectangle"
      >
        <span className="text-lg">▭</span>
        <span>Rectangle</span>
      </button>

      <button
        type="button"
        onClick={addCircleElement}
        className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
        title="Add circle"
      >
        <span className="text-lg">⚪</span>
        <span>Circle</span>
      </button>

      <button
        type="button"
        onClick={addContainerElement}
        className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
        title="Add container"
      >
        <span className="text-lg">📦</span>
        <span>Container</span>
      </button>

      <button
        type="button"
        onClick={addButtonElement}
        className="flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
        title="Add button"
      >
        <span className="text-lg">🔘</span>
        <span>Button</span>
      </button>

      <div className="border-t border-zinc-200 pt-2 dark:border-zinc-700">
        <button
          type="button"
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
