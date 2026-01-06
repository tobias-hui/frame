"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Moveable, {
  type OnDrag,
  type OnDragEnd,
  type OnResize,
  type OnResizeEnd,
  type OnRotate,
  type OnRotateEnd,
  type OnScale,
  type OnScaleEnd,
} from "react-moveable";
import { CANVAS_CONFIG, type CanvasElement, useCanvasStore } from "@/lib/store/canvas-store";
import { CanvasElementRenderer } from "./canvas-element-renderer";

interface DesignCanvasProps {
  className?: string;
}

export function DesignCanvas({ className }: DesignCanvasProps) {
  const { elements, selectedIds, setSelectedIds, updateElement, getElement } = useCanvasStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const moveableRef = useRef<Moveable | null>(null);
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

  // CRITICAL: Force Moveable to update rect when elements change
  // This fixes the "Ghost Box" problem where control box gets out of sync
  useEffect(() => {
    if (moveableRef.current && targetElements.length > 0) {
      moveableRef.current.updateRect();
    }
  }, [targetElements]);

  // Handle drag - apply offset with zoom compensation
  const handleDrag = useCallback(
    (params: OnDrag) => {
      const { target, beforeTranslate } = params;
      const elementId = (target as HTMLElement).getAttribute("data-element-id");
      if (!elementId) return;

      const element = getElement(elementId);
      if (!element) return;

      // Get current rotation and scale
      const rotation = element.rotation ?? 0;
      const scaleX = element.scaleX ?? 1;
      const scaleY = element.scaleY ?? 1;

      // Key insight: element.x/y are in canvas coordinates
      // beforeTranslate is in screen coordinates (already scaled)
      // To set inline transform on a scaled element, we need to:
      // 1. Convert canvas position to screen coordinates (multiply by scale)
      // 2. Add the drag offset (beforeTranslate is already in screen coords)
      const screenX = element.x * canvasSize.scale;
      const screenY = element.y * canvasSize.scale;
      const totalX = screenX + beforeTranslate[0];
      const totalY = screenY + beforeTranslate[1];

      (target as HTMLElement).style.transform =
        `translate(${totalX}px, ${totalY}px) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
    },
    [getElement, canvasSize.scale]
  );

  const handleDragEnd = useCallback(
    (params: OnDragEnd) => {
      const { lastEvent, target } = params;
      if (!lastEvent || !target) return;

      const elementId = (target as HTMLElement).getAttribute("data-element-id");
      if (!elementId) return;

      const element = getElement(elementId);
      if (!element) return;

      // lastEvent.translate is in screen coordinates
      // Convert to canvas coordinates by dividing by scale
      const newX = element.x + lastEvent.translate[0] / canvasSize.scale;
      const newY = element.y + lastEvent.translate[1] / canvasSize.scale;

      updateElement(elementId, {
        x: newX,
        y: newY,
      });

      // Transform will be updated by React re-render with new x, y
    },
    [updateElement, getElement, canvasSize.scale]
  );

  // Handle resize - build complete transform with zoom compensation
  const handleResize = useCallback(
    (params: OnResize) => {
      const { target, width, height } = params;
      const beforeTranslate = (params as { beforeTranslate?: [number, number] }).beforeTranslate;
      const elementId = (target as HTMLElement).getAttribute("data-element-id");
      if (!elementId) return;
      const element = getElement(elementId);

      (target as HTMLElement).style.width = `${width}px`;
      (target as HTMLElement).style.height = `${height}px`;

      if (element) {
        const rotation = element.rotation ?? 0;
        const scaleX = element.scaleX ?? 1;
        const scaleY = element.scaleY ?? 1;
        // Convert canvas position to screen coordinates and add drag offset
        const screenX = element.x * canvasSize.scale;
        const screenY = element.y * canvasSize.scale;
        const totalX = screenX + (beforeTranslate?.[0] || 0);
        const totalY = screenY + (beforeTranslate?.[1] || 0);
        (target as HTMLElement).style.transform =
          `translate(${totalX}px, ${totalY}px) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
      }
    },
    [getElement, canvasSize.scale]
  );

  const handleResizeEnd = useCallback(
    (params: OnResizeEnd) => {
      const { lastEvent, target } = params;
      if (!lastEvent || !target) return;

      const elementId = (target as HTMLElement).getAttribute("data-element-id");
      if (!elementId) return;

      const element = getElement(elementId);
      if (!element) return;

      // delta is in screen coordinates, convert to canvas coordinates
      const newWidth = Math.max(50, element.width + lastEvent.delta[0] / canvasSize.scale);
      const newHeight = Math.max(50, element.height + lastEvent.delta[1] / canvasSize.scale);

      const updates: Partial<CanvasElement> = {
        width: newWidth,
        height: newHeight,
      };

      // If there was drag during resize, update position (convert screen to canvas coords)
      if (lastEvent.drag) {
        updates.x = element.x + lastEvent.drag.translate[0] / canvasSize.scale;
        updates.y = element.y + lastEvent.drag.translate[1] / canvasSize.scale;
      }

      updateElement(elementId, updates);
    },
    [updateElement, getElement, canvasSize.scale]
  );

  // Handle rotate - build complete transform
  const handleRotate = useCallback(
    (params: OnRotate) => {
      const { target, transform, drag } = params;
      const beforeTranslate = (params as { beforeTranslate?: [number, number] }).beforeTranslate;
      const elementId = (target as HTMLElement).getAttribute("data-element-id");
      if (!elementId) return;
      const element = getElement(elementId);

      if (element && drag?.transform) {
        (target as HTMLElement).style.transform = drag.transform;
      } else if (element) {
        const scaleX = element.scaleX ?? 1;
        const scaleY = element.scaleY ?? 1;
        // Convert canvas position to screen coordinates and add drag offset
        const screenX = element.x * canvasSize.scale;
        const screenY = element.y * canvasSize.scale;
        const totalX = screenX + (beforeTranslate?.[0] || 0);
        const totalY = screenY + (beforeTranslate?.[1] || 0);
        (target as HTMLElement).style.transform =
          `translate(${totalX}px, ${totalY}px) ${transform} scale(${scaleX}, ${scaleY})`;
      } else {
        (target as HTMLElement).style.transform = transform;
      }
    },
    [getElement, canvasSize.scale]
  );

  const handleRotateEnd = useCallback(
    (params: OnRotateEnd) => {
      const { lastEvent, target } = params;
      if (!lastEvent || !target) return;

      const elementId = (target as HTMLElement).getAttribute("data-element-id");
      if (!elementId) return;

      const element = getElement(elementId);
      if (!element) return;

      const currentRotation = element.rotation ?? 0;
      const newRotation = currentRotation + lastEvent.rotate;

      const updates: Partial<CanvasElement> = {
        rotation: newRotation,
      };

      // If there was drag during rotate, also update position (convert screen to canvas coords)
      if (lastEvent.drag) {
        updates.x = element.x + lastEvent.drag.translate[0] / canvasSize.scale;
        updates.y = element.y + lastEvent.drag.translate[1] / canvasSize.scale;
      }

      updateElement(elementId, updates);
    },
    [updateElement, getElement, canvasSize.scale]
  );

  // Handle scale - build complete transform
  const handleScale = useCallback(
    (params: OnScale) => {
      const { target, delta, drag } = params;
      const beforeTranslate = (params as { beforeTranslate?: [number, number] }).beforeTranslate;
      const elementId = (target as HTMLElement).getAttribute("data-element-id");
      if (!elementId) return;
      const element = getElement(elementId);

      if (element && drag?.transform) {
        (target as HTMLElement).style.transform = drag.transform;
      } else if (element) {
        const rotation = element.rotation ?? 0;
        const currentScaleX = element.scaleX ?? 1;
        const currentScaleY = element.scaleY ?? 1;
        const newScaleX = currentScaleX * delta[0];
        const newScaleY = currentScaleY * delta[1];
        // Convert canvas position to screen coordinates and add drag offset
        const screenX = element.x * canvasSize.scale;
        const screenY = element.y * canvasSize.scale;
        const totalX = screenX + (beforeTranslate?.[0] || 0);
        const totalY = screenY + (beforeTranslate?.[1] || 0);
        (target as HTMLElement).style.transform =
          `translate(${totalX}px, ${totalY}px) rotate(${rotation}deg) scale(${newScaleX}, ${newScaleY})`;
      }
    },
    [getElement, canvasSize.scale]
  );

  const handleScaleEnd = useCallback(
    (params: OnScaleEnd) => {
      const { lastEvent, target } = params;
      if (!lastEvent || !target) return;

      const elementId = (target as HTMLElement).getAttribute("data-element-id");
      if (!elementId) return;

      const element = getElement(elementId);
      if (!element) return;

      const currentScaleX = element.scaleX ?? 1;
      const currentScaleY = element.scaleY ?? 1;

      const updates: Partial<CanvasElement> = {
        scaleX: Math.max(0.1, currentScaleX * lastEvent.delta[0]),
        scaleY: Math.max(0.1, currentScaleY * lastEvent.delta[1]),
      };

      // If there was drag during scale, also update position (convert screen to canvas coords)
      if (lastEvent.drag) {
        updates.x = element.x + lastEvent.drag.translate[0] / canvasSize.scale;
        updates.y = element.y + lastEvent.drag.translate[1] / canvasSize.scale;
      }

      updateElement(elementId, updates);
    },
    [updateElement, getElement, canvasSize.scale]
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

  // Handle keyboard events for canvas
  const handleCanvasKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (e.target === contentRef.current) {
          setSelectedIds([]);
        }
      }
    },
    [setSelectedIds]
  );

  // Handle delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedIds.length > 0 &&
        document.activeElement?.tagName !== "INPUT"
      ) {
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
      <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
        <div
          className="relative bg-white shadow-2xl dark:bg-zinc-800"
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
          }}
        >
          {/* biome-ignore lint/a11y/useSemanticElements: Canvas container needs to be a div for layout */}
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
            onKeyDown={handleCanvasKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Canvas - click to deselect"
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
                ref={moveableRef}
                key={`moveable-${selectedIds.join("-")}`}
                target={targetElements}
                zoom={canvasSize.scale}
                draggable
                resizable
                rotatable
                scalable
                origin={false}
                keepRatio={false}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                onResize={handleResize}
                onResizeEnd={handleResizeEnd}
                onRotate={handleRotate}
                onRotateEnd={handleRotateEnd}
                onScale={handleScale}
                onScaleEnd={handleScaleEnd}
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
