"use client";

import type Konva from "konva";
import { memo, useEffect, useRef, useState } from "react";
import { Circle, Group, Image as KonvaImage, Rect, Text } from "react-konva";
import type { CanvasElement } from "@/lib/store/canvas-store";

interface KonvaElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd?: (element: CanvasElement, x: number, y: number) => void;
}

export const KonvaElementRenderer = memo(
  ({ element, isSelected, onSelect, onDragEnd }: KonvaElementRendererProps) => {
    const imageRef = useRef<Konva.Image>(null);
    const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

    // Load image when element.src changes
    useEffect(() => {
      if (element.type === "image" && element.src) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          setImageObj(img);
        };
        img.src = element.src;
      }
    }, [element.type, element.src]);

    // Common props for all elements
    const commonProps = {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      rotation: element.rotation ?? 0,
      scaleX: element.scaleX ?? 1,
      scaleY: element.scaleY ?? 1,
      opacity: element.opacity ?? 1,
      draggable: true,
      onDragStart: (_e: Konva.KonvaEventObject<DragEvent>) => {
        onSelect();
      },
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
        if (onDragEnd) {
          const target = e.target as Konva.Node;
          onDragEnd(element, target.x(), target.y());
        }
      },
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        onSelect();
      },
      onTap: (e: Konva.KonvaEventObject<TouchEvent>) => {
        e.cancelBubble = true;
        onSelect();
      },
    };

    // Render based on element type
    const renderElement = () => {
      switch (element.type) {
        case "shape":
          // Check if it's a circle (borderRadius = "50%")
          if (element.borderRadius === "50%") {
            return (
              <Circle
                {...commonProps}
                radius={Math.min(element.width, element.height) / 2}
                fill={element.backgroundColor || "#3b82f6"}
              />
            );
          }
          // Otherwise render as rectangle
          return (
            <Rect
              {...commonProps}
              fill={element.backgroundColor || "#3b82f6"}
              cornerRadius={parseInt(element.borderRadius || "0", 10)}
              stroke={isSelected ? "#3b82f6" : undefined}
              strokeWidth={isSelected ? 2 : 0}
            />
          );

        case "image":
          return (
            <Rect
              {...commonProps}
              fill={element.backgroundColor || "#f0f0f0"}
              cornerRadius={parseInt(element.borderRadius || "8", 10)}
              stroke={isSelected ? "#3b82f6" : undefined}
              strokeWidth={isSelected ? 2 : 0}
            >
              {imageObj && (
                <KonvaImage
                  ref={imageRef}
                  image={imageObj}
                  width={element.width}
                  height={element.height}
                />
              )}
            </Rect>
          );

        case "text":
          return (
            <Group
              x={element.x}
              y={element.y}
              rotation={element.rotation ?? 0}
              scaleX={element.scaleX ?? 1}
              scaleY={element.scaleY ?? 1}
              opacity={element.opacity ?? 1}
            >
              {/* Hit detection area (invisible but clickable) */}
              <Rect
                width={element.width}
                height={element.height}
                fill="transparent"
                draggable={true}
                onDragStart={() => onSelect()}
                onDragEnd={(e) => onDragEnd?.(element, e.target.x(), e.target.y())}
                onClick={(e) => {
                  e.cancelBubble = true;
                  onSelect();
                }}
                onTap={(e) => {
                  e.cancelBubble = true;
                  onSelect();
                }}
              />
              {isSelected && (
                <Rect
                  width={element.width}
                  height={element.height}
                  fill="transparent"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDash={[4, 4]}
                />
              )}
              <Text
                text={element.content || "Text"}
                fontSize={parseInt(element.fontSize || "16", 10)}
                fontStyle={element.fontWeight || "normal"}
                fill={element.color || "#000000"}
                align={(element.textAlign as "left" | "center" | "right" | "justify") || "left"}
                width={element.width}
                height={element.height}
                padding={10}
                verticalAlign="middle"
              />
            </Group>
          );

        case "container":
          return (
            <Group {...commonProps}>
              <Rect
                width={element.width}
                height={element.height}
                fill="rgba(245, 245, 245, 0.5)"
                stroke="rgba(200, 200, 200, 0.5)"
                strokeWidth={2}
                strokeDash={[5, 5]}
                cornerRadius={parseInt(element.borderRadius || "8", 10)}
              />
              {/* Render children if needed */}
              {element.children?.map((child) => (
                <KonvaElementRenderer
                  key={child.id}
                  element={child}
                  isSelected={false}
                  onSelect={() => {}}
                />
              ))}
            </Group>
          );

        case "button":
          return (
            <Group {...commonProps}>
              <Rect
                width={element.width}
                height={element.height}
                fill={element.backgroundColor || "#3b82f6"}
                cornerRadius={parseInt(element.borderRadius || "8", 10)}
                shadowColor="rgba(0, 0, 0, 0.2)"
                shadowBlur={4}
                shadowOffset={{ x: 0, y: 2 }}
                shadowOpacity={0.3}
              />
              <Text
                text={element.content || "Button"}
                fontSize={14}
                fontStyle="bold"
                fill="#ffffff"
                width={element.width}
                height={element.height}
                align="center"
                verticalAlign="middle"
              />
            </Group>
          );

        default:
          return (
            <Rect {...commonProps} fill="#f0f0f0" stroke="#999" strokeWidth={1}>
              <Text
                text="Unknown type"
                fontSize={12}
                fill="#666"
                width={element.width}
                height={element.height}
                align="center"
                verticalAlign="middle"
              />
            </Rect>
          );
      }
    };

    return renderElement();
  }
);

KonvaElementRenderer.displayName = "KonvaElementRenderer";
