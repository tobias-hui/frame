"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Moveable from "react-moveable";
import { useCanvasStore, CANVAS_CONFIG } from "@/lib/store/canvas-store";
import { CanvasElementRenderer } from "./canvas-element-renderer";

interface DesignCanvasProps {
  className?: string;
}

export function DesignCanvas({ className }: DesignCanvasProps) {
  const {
    elements,
    selectedIds,
    setSelectedIds,
    updateElementStyle,
    updateElement,
    getElement,
  } = useCanvasStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [targetElements, setTargetElements] = useState<HTMLElement[]>([]);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number; scale: number }>({
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

  // Update target elements when selection changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const elements = selectedIds
        .map((id) => document.querySelector(`[data-element-id="${id}"]`) as HTMLElement)
        .filter((el): el is HTMLElement => el !== null);
      setTargetElements(elements);
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedIds]);

  // Handle drag - use drag.transform which preserves original transform
  const handleDrag = useCallback((params: any) => {
    const { target, drag } = params;
    target.style.transform = drag.transform;
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    (params: any) => {
      const { lastEvent, target } = params;
      if (!lastEvent || !target) return;

      const elementId = target.getAttribute("data-element-id");
      if (!elementId) return;

      // Get current element data from store (not from closure)
      const element = getElement(elementId);
      if (!element) return;

      const currentLeft = parseInt(element.style.left) || 0;
      const currentTop = parseInt(element.style.top) || 0;

      // Calculate new position (zoom handles scale conversion)
      const newLeft = currentLeft + lastEvent.translate[0];
      const newTop = currentTop + lastEvent.translate[1];

      // Update store
      updateElementStyle(elementId, {
        left: `${newLeft}px`,
        top: `${newTop}px`,
      });

      // Reset transform - React will re-render with new left/top
      target.style.transform = element.style.transform || "";
    },
    [updateElementStyle, getElement]
  );

  // Handle resize
  const handleResize = useCallback((params: any) => {
    const { target, width, height, drag } = params;
    target.style.width = `${width}px`;
    target.style.height = `${height}px`;
    target.style.transform = drag.transform;
  }, []);

  // Handle resize end
  const handleResizeEnd = useCallback(
    (params: any) => {
      const { lastEvent, target } = params;
      if (!lastEvent || !target) return;

      const elementId = target.getAttribute("data-element-id");
      if (!elementId) return;

      const element = getElement(elementId);
      if (!element) return;

      const currentWidth = parseInt(element.style.width) || 0;
      const currentHeight = parseInt(element.style.height) || 0;

      updateElementStyle(elementId, {
        width: `${Math.max(50, currentWidth + lastEvent.delta[0])}px`,
        height: `${Math.max(50, currentHeight + lastEvent.delta[1])}px`,
      });

      target.style.transform = element.style.transform || "";
    },
    [updateElementStyle, getElement]
  );

  // Handle rotate
  const handleRotate = useCallback((params: any) => {
    const { target, transform } = params;
    target.style.transform = transform;
  }, []);

  // Handle rotate end
  const handleRotateEnd = useCallback(
    (params: any) => {
      const { lastEvent, target } = params;
      if (!lastEvent || !target) return;

      const elementId = target.getAttribute("data-element-id");
      if (!elementId) return;

      const element = getElement(elementId);
      if (!element) return;

      const currentRotation = element.style.transform?.match(/rotate\(([-\d.]+)deg\)/)?.[1]
        ? parseFloat(element.style.transform.match(/rotate\(([-\d.]+)deg\)/)![1])
        : 0;

      const newRotation = currentRotation + lastEvent.rotate;

      updateElementStyle(elementId, {
        transform: `rotate(${newRotation}deg)`,
      });
    },
    [updateElementStyle, getElement]
  );

  // Handle click on canvas to deselect
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === contentRef.current) {
        setSelectedIds([]);
      }
    },
    [setSelectedIds]
  );

  // Handle delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") &&
          selectedIds.length > 0 &&
          document.activeElement?.tagName !== "INPUT") {
        selectedIds.forEach((id) => {
          useCanvasStore.getState().deleteElement(id);
        });
        setSelectedIds([]);
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
      {/* Canvas Container */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
        {/* Scaled Canvas Container */}
        <div
          className="relative bg-white shadow-2xl dark:bg-zinc-800"
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
          }}
        >
          {/* Content Area with scale transform */}
          <div
            ref={contentRef}
            className="relative overflow-hidden"
            style={{
              width: `${CANVAS_CONFIG.width}px`,
              height: `${CANVAS_CONFIG.height}px`,
              transform: `scale(${canvasSize.scale})`,
              transformOrigin: "top left",
            }}
            onClick={handleCanvasClick}
          >
            {elements.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
                    Your canvas is empty
                  </p>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
                    Start a conversation to generate designs
                  </p>
                </div>
              </div>
            ) : (
              elements.map((element) => (
                <CanvasElementRenderer
                  key={element.id}
                  element={element}
                  isSelected={selectedIds.includes(element.id)}
                  onSelect={() => setSelectedIds([element.id])}
                />
              ))
            )}

            {/* Moveable Control */}
            {targetElements.length > 0 && (
              <Moveable
                key={`moveable-${selectedIds.join("-")}`}
                target={targetElements}
                zoom={canvasSize.scale}
                draggable
                resizable
                rotatable
                origin={false}
                keepRatio={false}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                onResize={handleResize}
                onResizeEnd={handleResizeEnd}
                onRotate={handleRotate}
                onRotateEnd={handleRotateEnd}
                renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
                className="!z-[9999]"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
