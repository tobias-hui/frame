"use client";

import type Konva from "konva";
import { useEffect, useRef, useState } from "react";
import { Circle, Group, Image as KonvaImage, Rect, Text } from "react-konva";
import type { CanvasElement } from "@/lib/store/canvas-store";

interface KonvaElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick?: () => void;
}

export const KonvaElementRenderer = ({ element, isSelected, onSelect, onDoubleClick }: KonvaElementRendererProps) => {
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
    id: `node-${element.id}`, // 用于 Transformer 查找
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation ?? 0,
    scaleX: element.scaleX ?? 1,
    scaleY: element.scaleY ?? 1,
    opacity: element.opacity ?? 1,
    draggable: true,
    // 拖动开始时自动选中元素
    onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      if (!isSelected) {
        onSelect();
      }
    },
    // 点击选中元素
    onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      onSelect();
    },
    onTap: (e: Konva.KonvaEventObject<TouchEvent>) => {
      e.cancelBubble = true;
      onSelect();
    },
    // 双击编辑文本
    onDoubleClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      if (onDoubleClick) onDoubleClick();
    },
    onDblClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      if (onDoubleClick) onDoubleClick();
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
          />
        );

      case "image":
        return (
          <Rect
            {...commonProps}
            fill={element.backgroundColor || "#f0f0f0"}
            cornerRadius={parseInt(element.borderRadius || "8", 10)}
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
            id={`node-${element.id}`}
            x={element.x}
            y={element.y}
            rotation={element.rotation ?? 0}
            scaleX={element.scaleX ?? 1}
            scaleY={element.scaleY ?? 1}
            opacity={element.opacity ?? 1}
            draggable={true}
            onDragStart={(e) => {
              e.cancelBubble = true;
              if (!isSelected) {
                onSelect();
              }
            }}
            onClick={(e) => {
              e.cancelBubble = true;
              onSelect();
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              onSelect();
            }}
            onDoubleClick={(e: Konva.KonvaEventObject<MouseEvent>) => {
              e.cancelBubble = true;
              if (onDoubleClick) onDoubleClick();
            }}
            onDblClick={(e: Konva.KonvaEventObject<MouseEvent>) => {
              e.cancelBubble = true;
              if (onDoubleClick) onDoubleClick();
            }}
          >
            {/* Text */}
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
};
