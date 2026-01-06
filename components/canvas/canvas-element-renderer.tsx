"use client";

import { memo } from "react";
import { CanvasElement } from "@/lib/store/canvas-store";

interface CanvasElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
}

export const CanvasElementRenderer = memo(
  ({ element, isSelected, onSelect }: CanvasElementRendererProps) => {
    // Base styles from the store (CSS-aligned)
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      left: element.style.left,
      top: element.style.top,
      width: element.style.width,
      height: element.style.height,
      transform: element.style.transform,
      zIndex: element.style.zIndex ?? 1,
      opacity: element.style.opacity ?? 1,
      borderRadius: element.style.borderRadius,
      backgroundColor: element.style.backgroundColor,
      border: element.style.border,
      cursor: "move",
      userSelect: "none",
    };

    // Selection outline
    if (isSelected) {
      baseStyle.outline = "2px solid #3b82f6";
      baseStyle.outlineOffset = "2px";
    }

    // Render based on element type
    const renderContent = () => {
      switch (element.type) {
        case "text":
          return (
            <div
              className="flex h-full w-full items-center justify-center p-2"
              style={{
                color: element.style.color || "inherit",
                fontSize: element.style.fontSize || "16px",
                fontWeight: element.style.fontWeight || "normal",
                textAlign: (element.style.textAlign || "left") as "left" | "center" | "right" | "justify",
              }}
            >
              {element.content || "Text"}
            </div>
          );

        case "image":
          return (
            element.src ? (
              <img
                src={element.src}
                alt={element.name || "Image"}
                className="h-full w-full object-cover pointer-events-none"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-200 dark:bg-zinc-700">
                <span className="text-sm text-zinc-500">No image</span>
              </div>
            )
          );

        case "shape":
          return (
            <div
              className="h-full w-full"
              style={{
                backgroundColor: element.style.backgroundColor || "#3b82f6",
                borderRadius: element.style.borderRadius || "0px",
              }}
            />
          );

        case "container":
          return (
            <div className="h-full w-full border-2 border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/50">
              {/* Render nested children */}
              {element.children?.map((child) => (
                <CanvasElementRenderer
                  key={child.id}
                  element={child}
                  isSelected={false}
                  onSelect={() => {}}
                />
              ))}
            </div>
          );

        case "button":
          return (
            <button
              className="h-full w-full rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 active:bg-blue-700"
              style={{
                backgroundColor: element.style.backgroundColor || "#3b82f6",
                borderRadius: element.style.borderRadius || "8px",
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {element.content || "Button"}
            </button>
          );

        default:
          return <div className="text-sm text-zinc-500">Unknown type</div>;
      }
    };

    return (
      <div
        data-element-id={element.id}
        style={baseStyle}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {renderContent()}
      </div>
    );
  }
);

CanvasElementRenderer.displayName = "CanvasElementRenderer";
