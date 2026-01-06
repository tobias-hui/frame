"use client";

import { useCallback, useEffect, useState } from "react";
import { type CanvasElement, useCanvasStore } from "@/lib/store/canvas-store";

interface SelectionControlsProps {
  selectedElements: CanvasElement[];
  scale: number;
}

export function SelectionControls({ selectedElements, scale }: SelectionControlsProps) {
  const { updateElement } = useCanvasStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, element: null as CanvasElement | null });

  // 只处理单个元素的选中
  const element = selectedElements.length === 1 ? selectedElements[0] : null;

  console.log("SelectionControls render:", {
    selectedElements: selectedElements.length,
    element: element ? { id: element.id, type: element.type, x: element.x, y: element.y } : null,
  });

  // 开始拖拽
  const handleMouseDown = useCallback(
    (handle: string, e: React.MouseEvent) => {
      if (!element) return;
      e.stopPropagation();
      setIsDragging(true);
      setDragHandle(handle);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        element: { ...element },
      });
    },
    [element]
  );

  // 处理鼠标移动
  useEffect(() => {
    if (!isDragging || !dragStart.element || !element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - dragStart.x) / scale;
      const deltaY = (e.clientY - dragStart.y) / scale;
      const el = dragStart.element;

      if (!el) return;

      if (dragHandle === "rotate") {
        // 计算旋转角度
        const centerX = el.x + (el.width * (el.scaleX || 1)) / 2;
        const centerY = el.y + (el.height * (el.scaleY || 1)) / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI) + 90;
        updateElement(element.id, { rotation: angle });
      } else if (dragHandle === "se") {
        updateElement(element.id, {
          width: Math.max(50, el.width + deltaX),
          height: Math.max(50, el.height + deltaY),
        });
      } else if (dragHandle === "sw") {
        updateElement(element.id, {
          x: el.x + deltaX,
          width: Math.max(50, el.width - deltaX),
          height: Math.max(50, el.height + deltaY),
        });
      } else if (dragHandle === "ne") {
        updateElement(element.id, {
          y: el.y + deltaY,
          width: Math.max(50, el.width + deltaX),
          height: Math.max(50, el.height - deltaY),
        });
      } else if (dragHandle === "nw") {
        updateElement(element.id, {
          x: el.x + deltaX,
          y: el.y + deltaY,
          width: Math.max(50, el.width - deltaX),
          height: Math.max(50, el.height - deltaY),
        });
      } else if (dragHandle === "n") {
        updateElement(element.id, {
          y: el.y + deltaY,
          height: Math.max(50, el.height - deltaY),
        });
      } else if (dragHandle === "s") {
        updateElement(element.id, {
          height: Math.max(50, el.height + deltaY),
        });
      } else if (dragHandle === "e") {
        updateElement(element.id, {
          width: Math.max(50, el.width + deltaX),
        });
      } else if (dragHandle === "w") {
        updateElement(element.id, {
          x: el.x + deltaX,
          width: Math.max(50, el.width - deltaX),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragHandle(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragHandle, dragStart, element, scale, updateElement]);

  if (!element) return null;

  const { x, y, width, height, rotation = 0, scaleX = 1, scaleY = 1 } = element;

  const actualWidth = width * scaleX;
  const actualHeight = height * scaleY;

  // 手柄样式
  const handleStyle = {
    position: "absolute" as const,
    width: "10px",
    height: "10px",
    backgroundColor: "#ffffff",
    border: "2px solid #8b5cf6",
    borderRadius: "2px",
    cursor: "pointer",
    zIndex: 10001,
  };

  const rotateHandleStyle = {
    position: "absolute" as const,
    width: "24px",
    height: "24px",
    backgroundColor: "#8b5cf6",
    border: "2px solid #ffffff",
    borderRadius: "50%",
    cursor: "grab",
    zIndex: 10001,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {/* 边框 */}
      <div
        style={{
          position: "absolute",
          left: `${x}px`,
          top: `${y}px`,
          width: `${actualWidth}px`,
          height: `${actualHeight}px`,
          border: "2px solid #8b5cf6",
          pointerEvents: "none",
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "center center",
        }}
      />

      {/* 连接线到旋转手柄 */}
      <div
        style={{
          position: "absolute",
          left: `${x + actualWidth / 2 - 1}px`,
          top: `${y - 25}px`,
          width: "2px",
          height: "25px",
          backgroundColor: "#8b5cf6",
          pointerEvents: "none",
        }}
      />

      {/* 四个角的手柄 */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Resize handles need to be divs for visual styling */}
      <div
        style={{ ...handleStyle, left: `${x - 5}px`, top: `${y - 5}px`, cursor: "nw-resize" }}
        onMouseDown={(e) => handleMouseDown("nw", e)}
      />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Resize handles need to be divs for visual styling */}
      <div
        style={{
          ...handleStyle,
          left: `${x + actualWidth - 5}px`,
          top: `${y - 5}px`,
          cursor: "ne-resize",
        }}
        onMouseDown={(e) => handleMouseDown("ne", e)}
      />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Resize handles need to be divs for visual styling */}
      <div
        style={{
          ...handleStyle,
          left: `${x + actualWidth - 5}px`,
          top: `${y + actualHeight - 5}px`,
          cursor: "se-resize",
        }}
        onMouseDown={(e) => handleMouseDown("se", e)}
      />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Resize handles need to be divs for visual styling */}
      <div
        style={{
          ...handleStyle,
          left: `${x - 5}px`,
          top: `${y + actualHeight - 5}px`,
          cursor: "sw-resize",
        }}
        onMouseDown={(e) => handleMouseDown("sw", e)}
      />

      {/* 四条边中间的手柄 */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Resize handles need to be divs for visual styling */}
      <div
        style={{
          ...handleStyle,
          left: `${x + actualWidth / 2 - 5}px`,
          top: `${y - 5}px`,
          cursor: "n-resize",
        }}
        onMouseDown={(e) => handleMouseDown("n", e)}
      />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Resize handles need to be divs for visual styling */}
      <div
        style={{
          ...handleStyle,
          left: `${x + actualWidth - 5}px`,
          top: `${y + actualHeight / 2 - 5}px`,
          cursor: "e-resize",
        }}
        onMouseDown={(e) => handleMouseDown("e", e)}
      />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Resize handles need to be divs for visual styling */}
      <div
        style={{
          ...handleStyle,
          left: `${x + actualWidth / 2 - 5}px`,
          top: `${y + actualHeight - 5}px`,
          cursor: "s-resize",
        }}
        onMouseDown={(e) => handleMouseDown("s", e)}
      />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Resize handles need to be divs for visual styling */}
      <div
        style={{
          ...handleStyle,
          left: `${x - 5}px`,
          top: `${y + actualHeight / 2 - 5}px`,
          cursor: "w-resize",
        }}
        onMouseDown={(e) => handleMouseDown("w", e)}
      />

      {/* 旋转手柄 - 在顶部中心上方 */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Rotate handle needs to be a div for styling */}
      <div
        style={{
          ...rotateHandleStyle,
          left: `${x + actualWidth / 2 - 12}px`,
          top: `${y - 37}px`,
          pointerEvents: "auto",
        }}
        onMouseDown={(e) => handleMouseDown("rotate", e)}
      >
        {/* 旋转图标 */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          role="img"
          aria-label="Rotate"
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      </div>
    </div>
  );
}
