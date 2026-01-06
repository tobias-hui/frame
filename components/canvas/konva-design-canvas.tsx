"use client";

import type Konva from "konva";
import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, Stage } from "react-konva";
import { CANVAS_CONFIG, type CanvasElement, useCanvasStore } from "@/lib/store/canvas-store";
import { ContextMenu } from "./context-menu";
import { DomOverlayLayer } from "./dom-overlay-layer";
import { KeyboardShortcutsPanel } from "./keyboard-shortcuts-panel";
import { KonvaElementRenderer } from "./konva-element-renderer";

interface KonvaDesignCanvasProps {
  className?: string;
}

export function KonvaDesignCanvas({ className }: KonvaDesignCanvasProps) {
  const { elements, selectedIds, setSelectedIds, updateElement } = useCanvasStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [canvasSize, setCanvasSize] = useState<{
    width: number;
    height: number;
    scale: number;
  }>({
    width: CANVAS_CONFIG.width,
    height: CANVAS_CONFIG.height,
    scale: 1,
  });

  // Calculate responsive canvas size
  useEffect(() => {
    const calculateCanvasSize = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const padding = window.innerWidth >= 640 ? 64 : 32;
      const availableWidth = container.clientWidth - padding;
      const availableHeight = container.clientHeight - padding;

      const widthScale = availableWidth / CANVAS_CONFIG.width;
      const heightScale = availableHeight / CANVAS_CONFIG.height;
      const scale = Math.min(widthScale, heightScale, 1);

      setCanvasSize({
        width: CANVAS_CONFIG.width * scale,
        height: CANVAS_CONFIG.height * scale,
        scale,
      });
    };

    calculateCanvasSize();

    const resizeObserver = new ResizeObserver(() => calculateCanvasSize());
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", calculateCanvasSize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", calculateCanvasSize);
    };
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    (element: CanvasElement, x: number, y: number) => {
      updateElement(element.id, { x, y });
    },
    [updateElement]
  );

  // Handle click on canvas to deselect
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // If clicked on empty space (not on an element)
      if (e.target === e.target.getStage()) {
        setSelectedIds([]);
      }
    },
    [setSelectedIds]
  );

  // Handle tap on canvas to deselect (for touch devices)
  const handleStageTap = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      // If tapped on empty space (not on an element)
      if (e.target === e.target.getStage()) {
        setSelectedIds([]);
      }
    },
    [setSelectedIds]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const state = useCanvasStore.getState();

      // Delete / Backspace
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length > 0) {
        selectedIds.forEach((id) => {
          state.deleteElement(id);
        });
        setSelectedIds([]);
        return;
      }

      // Ctrl+C / Cmd+C - Copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedIds.length > 0) {
        e.preventDefault();
        state.copyElements(selectedIds);
        return;
      }

      // Ctrl+V / Cmd+V - Paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        state.pasteElements();
        return;
      }

      // Ctrl+D / Cmd+D - Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && selectedIds.length > 0) {
        e.preventDefault();
        state.duplicateElements(selectedIds);
        return;
      }

      // Ctrl+Z / Cmd+Z - Undo (placeholder)
      // Ctrl+Y / Cmd+Y / Ctrl+Shift+Z - Redo (placeholder)

      // Bring to Front (Ctrl+Shift+])
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "]" && selectedIds.length === 1) {
        e.preventDefault();
        state.bringToFront(selectedIds[0]);
        return;
      }

      // Send to Back (Ctrl+Shift+[)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "[" && selectedIds.length === 1) {
        e.preventDefault();
        state.sendToBack(selectedIds[0]);
        return;
      }

      // Move Layer Up (Ctrl+])
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "]" && selectedIds.length === 1) {
        e.preventDefault();
        state.moveLayer(selectedIds[0], "up");
        return;
      }

      // Move Layer Down (Ctrl+[)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "[" && selectedIds.length === 1) {
        e.preventDefault();
        state.moveLayer(selectedIds[0], "down");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, setSelectedIds]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-auto bg-zinc-100 dark:bg-zinc-900 ${className}`}
    >
      <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
        <div
          className="relative bg-white shadow-2xl dark:bg-zinc-800"
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
          }}
        >
          <Stage
            ref={stageRef}
            width={CANVAS_CONFIG.width}
            height={CANVAS_CONFIG.height}
            scaleX={canvasSize.scale}
            scaleY={canvasSize.scale}
            onClick={handleStageClick}
            onTap={handleStageTap}
          >
            <Layer>
              {elements.length === 0 ? (
                <KonvaElementRenderer
                  element={{
                    id: "empty-placeholder",
                    type: "text",
                    content: "Your canvas is empty",
                    x: CANVAS_CONFIG.width / 2 - 100,
                    y: CANVAS_CONFIG.height / 2 - 25,
                    width: 200,
                    height: 50,
                    fontSize: "18px",
                    color: "#71717a",
                    textAlign: "center",
                  }}
                  isSelected={false}
                  onSelect={() => {}}
                />
              ) : (
                elements.map((element) => (
                  <KonvaElementRenderer
                    key={element.id}
                    element={element}
                    isSelected={selectedIds.includes(element.id)}
                    onSelect={() => setSelectedIds([element.id])}
                    onDragEnd={handleDragEnd}
                  />
                ))
              )}
            </Layer>
          </Stage>

          {/* DOM Overlay Layer for selection controls and text editing */}
          <div
            ref={canvasWrapperRef}
            data-dom-overlay="true"
            className="pointer-events-none absolute left-0 top-0"
            style={{
              width: `${CANVAS_CONFIG.width}px`,
              height: `${CANVAS_CONFIG.height}px`,
              transform: `scale(${canvasSize.scale})`,
              transformOrigin: "top left",
            }}
          >
            <DomOverlayLayer scale={canvasSize.scale} containerRef={canvasWrapperRef} />
          </div>
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu />

      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcutsPanel />
    </div>
  );
}
