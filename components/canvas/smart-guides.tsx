"use client";

import { useMemo, useRef } from "react";
import { Line, Rect } from "react-konva";
import type { CanvasElement } from "@/lib/store/canvas-store";

interface SmartGuideLine {
  type: "vertical" | "horizontal";
  position: number;
  range: [number, number]; // [start, end]
}

interface SmartGuidesProps {
  guides: SmartGuideLine[];
  scale: number;
}

// 对齐线样式
const GUIDE_STROKE = "#8b5cf6";
const GUIDE_STROKE_WIDTH = 1;
const GUIDE_DASH = [4, 4];

export function SmartGuides({
  guides,
  scale,
}: Omit<SmartGuidesProps, "draggingElement" | "allElements" | "snapThreshold">) {
  const lines = useMemo(() => {
    return guides.map((guide, index) => {
      const isVertical = guide.type === "vertical";

      return (
        <Line
          key={`${guide.type}-${index}`}
          points={
            isVertical
              ? [guide.position, guide.range[0], guide.position, guide.range[1]]
              : [guide.range[0], guide.position, guide.range[1], guide.position]
          }
          stroke={GUIDE_STROKE}
          strokeWidth={GUIDE_STROKE_WIDTH / scale}
          dash={GUIDE_DASH.map((d) => d / scale)}
          listening={false}
          lineCap="round"
          lineJoin="round"
        />
      );
    });
  }, [guides, scale]);

  return <>{lines}</>;
}

// 辅助函数：获取元素的边界和中心点
function getElementBounds(element: CanvasElement) {
  const { x, y, width, height, rotation = 0, scaleX = 1, scaleY = 1 } = element;
  const actualWidth = width * scaleX;
  const actualHeight = height * scaleY;

  return {
    left: x,
    right: x + actualWidth,
    top: y,
    bottom: y + actualHeight,
    centerX: x + actualWidth / 2,
    centerY: y + actualHeight / 2,
    width: actualWidth,
    height: actualHeight,
  };
}

// 辅助函数：检查数值是否在阈值范围内
function isNear(value1: number, value2: number, threshold: number): boolean {
  return Math.abs(value1 - value2) < threshold;
}

// 辅助函数：找到最接近的对齐值
function findSnapPosition(
  value: number,
  targets: number[],
  threshold: number
): number | null {
  for (const target of targets) {
    if (isNear(value, target, threshold)) {
      return target;
    }
  }
  return null;
}

// 计算对齐线和吸附位置
export function calculateSmartGuides(
  draggingElement: CanvasElement,
  allElements: CanvasElement[],
  snapThreshold: number = 5
): { guides: SmartGuideLine[]; snappedPosition: { x?: number; y?: number } } {
  const draggingBounds = getElementBounds(draggingElement);
  const guides: SmartGuideLine[] = [];
  const snappedPosition: { x?: number; y?: number } = {};

  // 过滤出其他元素
  const otherElements = allElements.filter((el) => el.id !== draggingElement.id);

  // 收集所有可能的吸附目标
  const xTargets: number[] = [];
  const yTargets: number[] = [];

  otherElements.forEach((el) => {
    const bounds = getElementBounds(el);

    // 垂直线（X轴对齐）
    xTargets.push(bounds.left, bounds.centerX, bounds.right);

    // 水平线（Y轴对齐）
    yTargets.push(bounds.top, bounds.centerY, bounds.bottom);
  });

  // 检查拖拽元素的各个点是否对齐
  const dragPoints = {
    left: draggingBounds.left,
    centerX: draggingBounds.centerX,
    right: draggingBounds.right,
    top: draggingBounds.top,
    centerY: draggingBounds.centerY,
    bottom: draggingBounds.bottom,
  };

  // X轴对齐检查
  for (const [pointName, pointValue] of Object.entries(dragPoints)) {
    if (pointName === "top" || pointName === "centerY" || pointName === "bottom") continue;

    const snapX = findSnapPosition(pointValue, xTargets, snapThreshold);
    if (snapX !== null) {
      const offsetX = snapX - pointValue;

      // 只有在第一个找到的吸附位置才设置（优先级：center > left/right > top/bottom）
      if (snappedPosition.x === undefined) {
        snappedPosition.x = draggingElement.x + offsetX;
      }

      // 添加对齐线
      let guideStart: number;
      let guideEnd: number;

      if (pointName === "centerX") {
        // 中心对齐线
        guideStart = Math.min(0, draggingBounds.top);
        guideEnd = Math.max(
          draggingBounds.bottom,
          ...otherElements.map((el) => getElementBounds(el).bottom)
        );
      } else {
        // 边缘对齐线
        guideStart = Math.min(draggingBounds.top, draggingBounds.bottom);
        guideEnd = Math.max(draggingBounds.top, draggingBounds.bottom);
      }

      guides.push({
        type: "vertical",
        position: snapX,
        range: [guideStart - 10, guideEnd + 10],
      });
    }
  }

  // Y轴对齐检查
  for (const [pointName, pointValue] of Object.entries(dragPoints)) {
    if (pointName === "left" || pointName === "centerX" || pointName === "right") continue;

    const snapY = findSnapPosition(pointValue, yTargets, snapThreshold);
    if (snapY !== null) {
      const offsetY = snapY - pointValue;

      // 只有在第一个找到的吸附位置才设置
      if (snappedPosition.y === undefined) {
        snappedPosition.y = draggingElement.y + offsetY;
      }

      // 添加对齐线
      let guideStart: number;
      let guideEnd: number;

      if (pointName === "centerY") {
        // 中心对齐线
        guideStart = Math.min(0, draggingBounds.left);
        guideEnd = Math.max(
          draggingBounds.right,
          ...otherElements.map((el) => getElementBounds(el).right)
        );
      } else {
        // 边缘对齐线
        guideStart = Math.min(draggingBounds.left, draggingBounds.right);
        guideEnd = Math.max(draggingBounds.left, draggingBounds.right);
      }

      guides.push({
        type: "horizontal",
        position: snapY,
        range: [guideStart - 10, guideEnd + 10],
      });
    }
  }

  // 去重对齐线（相同位置和类型的只保留一条）
  const uniqueGuides = guides.filter((guide, index, self) => {
    return (
      index ===
      self.findIndex(
        (g) => g.type === guide.type && Math.abs(g.position - guide.position) < 0.1
      )
    );
  });

  return { guides: uniqueGuides, snappedPosition };
}

// 扩展：间距对齐（distribute spacing）
export function calculateSpacingGuides(
  draggingElement: CanvasElement,
  allElements: CanvasElement[],
  snapThreshold: number = 5
): SmartGuideLine[] {
  const draggingBounds = getElementBounds(draggingElement);
  const guides: SmartGuideLine[] = [];
  const otherElements = allElements.filter((el) => el.id !== draggingElement.id);

  // 计算与其他元素的间距
  otherElements.forEach((el) => {
    const bounds = getElementBounds(el);

    // 水平间距检查（左右相邻）
    if (
      isNear(draggingBounds.right, bounds.left, snapThreshold) ||
      isNear(draggingBounds.left, bounds.right, snapThreshold)
    ) {
      // 显示垂直间距指示线
      const spacing = Math.min(
        Math.abs(draggingBounds.right - bounds.left),
        Math.abs(draggingBounds.left - bounds.right)
      );

      if (spacing < 100) {
        // 只在合理间距内显示
        const top = Math.max(draggingBounds.top, bounds.top);
        const bottom = Math.min(draggingBounds.bottom, bounds.bottom);

        guides.push({
          type: "horizontal",
          position: top + (bottom - top) / 2,
          range: [
            Math.min(draggingBounds.right, bounds.left),
            Math.max(draggingBounds.right, bounds.left),
          ],
        });
      }
    }

    // 垂直间距检查（上下相邻）
    if (
      isNear(draggingBounds.bottom, bounds.top, snapThreshold) ||
      isNear(draggingBounds.top, bounds.bottom, snapThreshold)
    ) {
      const spacing = Math.min(
        Math.abs(draggingBounds.bottom - bounds.top),
        Math.abs(draggingBounds.top - bounds.bottom)
      );

      if (spacing < 100) {
        const left = Math.max(draggingBounds.left, bounds.left);
        const right = Math.min(draggingBounds.right, bounds.right);

        guides.push({
          type: "vertical",
          position: left + (right - left) / 2,
          range: [
            Math.min(draggingBounds.bottom, bounds.top),
            Math.max(draggingBounds.bottom, bounds.top),
          ],
        });
      }
    }
  });

  return guides;
}
