"use client";

import {
  Circle,
  ImagePlus,
  MousePointer2,
  Pencil,
  Plus,
  RectangleHorizontal,
  Square,
  Type,
  Video,
} from "lucide-react";
import { useCallback, useState } from "react";
import { CANVAS_CONFIG, useCanvasStore } from "@/lib/store/canvas-store";

interface CanvasToolbarProps {
  className?: string;
}

// 元素类型定义，用于拖拽
interface ElementType {
  type: "text" | "image" | "shape";
  label: string;
  icon: React.ReactNode;
  defaultProps: Partial<{
    content: string;
    src: string;
    width: number;
    height: number;
    backgroundColor: string;
    borderRadius: string;
    fontSize: string;
    fontWeight: string;
    color: string;
    textAlign: string;
  }>;
}

const ELEMENT_TYPES: ElementType[] = [
  {
    type: "text",
    label: "Text",
    icon: <Type className="h-4 w-4" />,
    defaultProps: {
      content: "Add text",
      width: 200,
      height: 40,
      fontSize: "16px",
      color: "#374151",
      textAlign: "left",
    },
  },
  {
    type: "shape",
    label: "Rectangle",
    icon: <RectangleHorizontal className="h-4 w-4" />,
    defaultProps: {
      width: 160,
      height: 120,
      backgroundColor: "#3b82f6",
      borderRadius: "8px",
    },
  },
  {
    type: "shape",
    label: "Square",
    icon: <Square className="h-4 w-4" />,
    defaultProps: {
      width: 120,
      height: 120,
      backgroundColor: "#10b981",
      borderRadius: "0px",
    },
  },
  {
    type: "shape",
    label: "Circle",
    icon: <Circle className="h-4 w-4" />,
    defaultProps: {
      width: 120,
      height: 120,
      backgroundColor: "#ec4899",
      borderRadius: "50%",
    },
  },
  {
    type: "image",
    label: "Image",
    icon: <ImagePlus className="h-4 w-4" />,
    defaultProps: {
      src: "https://via.placeholder.com/320x240",
      width: 320,
      height: 240,
      borderRadius: "8px",
    },
  },
  {
    type: "image",
    label: "Video",
    icon: <Video className="h-4 w-4" />,
    defaultProps: {
      src: "https://via.placeholder.com/320x240",
      width: 320,
      height: 240,
      borderRadius: "8px",
    },
  },
];

export function CanvasToolbar({ className }: CanvasToolbarProps) {
  const { addElement } = useCanvasStore();
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // 计算画布中心位置
  const getCenterPosition = useCallback((width: number, height: number) => {
    return {
      x: (CANVAS_CONFIG.width - width) / 2,
      y: (CANVAS_CONFIG.height - height) / 2,
    };
  }, []);

  // 添加元素到画布中心
  const handleAddElement = useCallback(
    (elementType: ElementType) => {
      const width = elementType.defaultProps.width ?? 100;
      const height = elementType.defaultProps.height ?? 100;
      const { x, y } = getCenterPosition(width, height);

      addElement({
        type: elementType.type,
        x,
        y,
        width,
        height,
        ...elementType.defaultProps,
      });
    },
    [addElement, getCenterPosition]
  );

  // 处理拖拽开始
  const handleDragStart = useCallback((e: React.DragEvent, elementType: ElementType) => {
    e.dataTransfer.setData("elementType", JSON.stringify(elementType));
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  return (
    <div
      className={`flex flex-col gap-0.5 rounded-lg bg-white/90 p-1 shadow-lg backdrop-blur-sm dark:bg-zinc-800/90 ${className}`}
    >
      {/* Selection Tool */}
      <button
        type="button"
        onClick={() => setActiveTool("select")}
        className={`flex h-10 w-10 items-center justify-center rounded transition-colors ${
          activeTool === "select"
            ? "bg-zinc-200 dark:bg-zinc-700"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
        title="Selection Tool"
      >
        <MousePointer2 className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
      </button>

      {/* Add Element */}
      <button
        type="button"
        onClick={() => setActiveTool("add")}
        className={`flex h-10 w-10 items-center justify-center rounded transition-colors ${
          activeTool === "add"
            ? "bg-zinc-200 dark:bg-zinc-700"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
        title="Add Element"
      >
        <Plus className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
      </button>

      {/* Rectangle Tool */}
      <button
        type="button"
        onClick={() => {
          setActiveTool("rectangle");
          handleAddElement(ELEMENT_TYPES[1]); // Rectangle
        }}
        className={`flex h-10 w-10 items-center justify-center rounded transition-colors ${
          activeTool === "rectangle"
            ? "bg-zinc-200 dark:bg-zinc-700"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
        title="Rectangle"
      >
        <RectangleHorizontal className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
      </button>

      {/* Text Tool */}
      <button
        type="button"
        onClick={() => {
          setActiveTool("text");
          handleAddElement(ELEMENT_TYPES[0]); // Text
        }}
        className={`flex h-10 w-10 items-center justify-center rounded transition-colors ${
          activeTool === "text"
            ? "bg-zinc-200 dark:bg-zinc-700"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
        title="Text"
      >
        <Type className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
      </button>

      {/* Pencil Tool */}
      <button
        type="button"
        onClick={() => setActiveTool("pencil")}
        className={`flex h-10 w-10 items-center justify-center rounded transition-colors ${
          activeTool === "pencil"
            ? "bg-zinc-200 dark:bg-zinc-700"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
        title="Pencil Tool"
      >
        <Pencil className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
      </button>

      {/* Separator */}
      <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />

      {/* Image Tool */}
      <button
        type="button"
        draggable
        onDragStart={(e) => handleDragStart(e, ELEMENT_TYPES[4])}
        onClick={() => {
          setActiveTool("image");
          handleAddElement(ELEMENT_TYPES[4]); // Image
        }}
        className={`flex h-10 w-10 items-center justify-center rounded transition-colors ${
          activeTool === "image"
            ? "bg-zinc-200 dark:bg-zinc-700"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
        title="Add Image"
      >
        <ImagePlus className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
      </button>

      {/* Video Tool */}
      <button
        type="button"
        draggable
        onDragStart={(e) => handleDragStart(e, ELEMENT_TYPES[5])}
        onClick={() => {
          setActiveTool("video");
          handleAddElement(ELEMENT_TYPES[5]); // Video
        }}
        className={`flex h-10 w-10 items-center justify-center rounded transition-colors ${
          activeTool === "video"
            ? "bg-zinc-200 dark:bg-zinc-700"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
        title="Add Video"
      >
        <Video className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
      </button>
    </div>
  );
}
