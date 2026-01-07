"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type CanvasElement, useCanvasStore } from "@/lib/store/canvas-store";

interface DomOverlayLayerProps {
  scale: number;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function DomOverlayLayer({ scale, containerRef }: DomOverlayLayerProps) {
  const { selectedIds, updateElement, getElement } = useCanvasStore();

  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [editingElement, setEditingElement] = useState<{
    element: CanvasElement;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get the overlay container
  useEffect(() => {
    if (containerRef?.current) {
      // The ref itself is the overlay container (has data-dom-overlay="true" attribute)
      setContainer(containerRef.current);
    }
  }, [containerRef]);

  // Get selected elements
  const selectedElements = selectedIds
    .map((id) => getElement(id))
    .filter((el): el is CanvasElement => el !== undefined);

  // Handle text editing
  const handleTextEditBlur = useCallback(() => {
    if (editingElement) {
      const textarea = document.getElementById("text-editing-textarea") as HTMLTextAreaElement;
      if (textarea) {
        updateElement(editingElement.element.id, {
          content: textarea.value,
        });
      }
      setEditingElement(null);
    }
  }, [editingElement, updateElement]);

  // Handle double-click on overlay element
  const handleOverlayDoubleClick = useCallback((element: CanvasElement) => {
    if (element.type === "text") {
      setEditingElement({ element });
    }
  }, []);

  // Focus textarea when editing starts
  useEffect(() => {
    if (editingElement && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editingElement]);

  // 处理双击编辑文本 - 通过自定义事件
  useEffect(() => {
    const handleEditText = (e: Event) => {
      const customEvent = e as CustomEvent<{ elementId: string }>;
      const { elementId } = customEvent.detail;
      const element = getElement(elementId);
      if (element?.type === "text") {
        setEditingElement({ element });
      }
    };

    window.addEventListener("edit-text", handleEditText);
    return () => {
      window.removeEventListener("edit-text", handleEditText);
    };
  }, [getElement]);

  if (!container) {
    return null;
  }

  // Render overlay elements and controls into the DOM overlay container
  return createPortal(
    <>
      {/* 移除了 OverlayElement - 它们会拦截 Konva 的拖拽事件 */}
      {/* 现在使用 Konva Transformer 处理选择和变换 */}

      {/* Text Editing Overlay */}
      {editingElement && (
        <div
          className="absolute z-[10000] overflow-hidden bg-white/90 shadow-lg"
          style={{
            left: `${editingElement.element.x}px`,
            top: `${editingElement.element.y}px`,
            width: `${editingElement.element.width}px`,
            height: `${editingElement.element.height}px`,
          }}
        >
          <textarea
            ref={textareaRef}
            id="text-editing-textarea"
            defaultValue={editingElement.element.content || ""}
            onBlur={handleTextEditBlur}
            className="h-full w-full resize-none bg-transparent p-2 outline-none"
            style={{
              fontSize: editingElement.element.fontSize || "16px",
              fontWeight: editingElement.element.fontWeight || "normal",
              color: editingElement.element.color || "#000000",
              textAlign:
                (editingElement.element.textAlign as "left" | "center" | "right" | "justify") ||
                "left",
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                handleTextEditBlur();
              }
            }}
          />
        </div>
      )}
    </>,
    container
  );
}
