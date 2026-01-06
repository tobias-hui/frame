"use client";

import { memo } from "react";
import type { CanvasElement } from "@/lib/store/canvas-store";

interface CanvasElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
}

export const CanvasElementRenderer = memo(
  ({ element, isSelected, onSelect }: CanvasElementRendererProps) => {
    // Build CSS transform - use translate for position instead of left/top
    const rotation = element.rotation ?? 0;
    const scaleX = element.scaleX ?? 1;
    const scaleY = element.scaleY ?? 1;
    const transform = `translate(${element.x}px, ${element.y}px) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;

    // Base styles - using transform for position (no left/top)
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      left: "0px",
      top: "0px",
      width: `${element.width}px`,
      height: `${element.height}px`,
      transform,
      transformOrigin: "0 0", // Important: translate(x,y) positions top-left corner
      zIndex: element.zIndex ?? 1,
      opacity: element.opacity ?? 1,
      borderRadius: element.borderRadius,
      backgroundColor: element.backgroundColor,
      border: element.border,
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
                color: element.color || "inherit",
                fontSize: element.fontSize || "16px",
                fontWeight: element.fontWeight || "normal",
                textAlign: (element.textAlign as "left" | "center" | "right" | "justify") || "left",
              }}
            >
              {element.content || "Text"}
            </div>
          );

        case "image":
          return element.src ? (
            // biome-ignore lint/performance/noImgElement: Using native img for canvas element rendering where Next.js Image won't work
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
          );

        case "shape":
          return (
            <div
              className="h-full w-full"
              style={{
                backgroundColor: element.backgroundColor || "#3b82f6",
                borderRadius: element.borderRadius || "0px",
              }}
            />
          );

        case "container":
          return (
            <div className="h-full w-full border-2 border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/50">
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
              type="button"
              className="h-full w-full rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 active:bg-blue-700"
              style={{
                backgroundColor: element.backgroundColor || "#3b82f6",
                borderRadius: element.borderRadius || "8px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {element.content || "Button"}
            </button>
          );

        default:
          return <div className="text-sm text-zinc-500">Unknown type</div>;
      }
    };

    return (
      // biome-ignore lint:a11y/useSemanticElements: These are container elements rendered by Konva canvas, not interactive elements
      <div
        data-element-id={element.id}
        style={baseStyle}
        role="presentation"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            onSelect();
          }
        }}
      >
        {renderContent()}
      </div>
    );
  }
);

CanvasElementRenderer.displayName = "CanvasElementRenderer";
