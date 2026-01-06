"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type CanvasElement, useCanvasStore } from "@/lib/store/canvas-store";
import { SelectionControls } from "./selection-controls";

interface DomOverlayLayerProps {
  scale: number;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

interface OverlayElementProps {
  element: CanvasElement;
  onDoubleClick: (element: CanvasElement) => void;
}

function OverlayElement({ element, onDoubleClick }: OverlayElementProps) {
  const rotation = element.rotation ?? 0;
  const scaleX = element.scaleX ?? 1;
  const scaleY = element.scaleY ?? 1;

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    transform: `rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`,
    transformOrigin: "0 0",
    pointerEvents: "auto",
    cursor: "move",
  };

  return (
    <button
      type="button"
      data-element-id={element.id}
      style={style}
      onDoubleClick={() => onDoubleClick(element)}
      aria-label={`Element ${element.id}`}
    />
  );
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
      const overlayContainer = containerRef.current.querySelector('[data-dom-overlay="true"]');
      if (overlayContainer) {
        console.log("DOM overlay container found:", overlayContainer);
        setContainer(overlayContainer as HTMLElement);
      } else {
        console.warn("DOM overlay container not found!");
      }
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

  if (!container) {
    return null;
  }

  // Render overlay elements and controls into the DOM overlay container
  return createPortal(
    <>
      {/* Render invisible overlay elements for moveable */}
      {selectedElements.map((element) => (
        <OverlayElement
          key={element.id}
          element={element}
          onDoubleClick={handleOverlayDoubleClick}
        />
      ))}

      {/* Selection Controls - Canva-style */}
      <SelectionControls selectedElements={selectedElements} scale={scale} />

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
