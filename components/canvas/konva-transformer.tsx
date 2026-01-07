"use client";

import type Konva from "konva";
import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, Transformer } from "react-konva";
import type { CanvasElement, useCanvasStore } from "@/lib/store/canvas-store";
import { SmartGuides, calculateSmartGuides, calculateSpacingGuides } from "./smart-guides";

interface KonvaTransformerProps {
  selectedElements: CanvasElement[];
  allElements: CanvasElement[];
  onTransformEnd?: (elementId: string, attrs: Partial<Konva.NodeConfig>) => void;
  onGuidesChange?: (guides: { type: "vertical" | "horizontal"; position: number; range: [number, number] }[]) => void;
  onDragStateChange?: (isDragging: boolean) => void;
}

export function KonvaTransformer({
  selectedElements,
  allElements,
  onTransformEnd,
  onGuidesChange,
  onDragStateChange,
}: KonvaTransformerProps) {
  const transformerRef = useRef<Konva.Transformer>(null);

  // 更新 transformer 的选中节点
  useEffect(() => {
    let rafId: number;

    if (!transformerRef.current || selectedElements.length === 0) {
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
      }
      return;
    }

    // 使用双重 requestAnimationFrame 确保 DOM 完全渲染后再绑定
    rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(() => {
        const transformer = transformerRef.current;
        if (!transformer) return;

        const stage = transformer.getStage();
        if (!stage) {
          transformer.nodes([]);
          return;
        }

        // 获取所有选中的 Konva 节点
        const nodes = selectedElements
          .map((element) => {
            // 通过 ID 查找对应的 Konva 节点
            const node = stage.findOne(`#node-${element.id}`);
            return node;
          })
          .filter((node): node is Konva.Node => node !== undefined);

        if (nodes.length === 0) {
          transformer.nodes([]);
          return;
        }

        console.log("KonvaTransformer: 绑定节点", nodes.map((n) => ({ id: n.id(), draggable: n.draggable() })));

        // 确保所有节点都可以拖拽
        nodes.forEach((node) => {
          node.draggable(true);
        });

        // 为每个节点添加拖拽移动监听器
        nodes.forEach((node) => {
          node.off("dragmove.smartguides");
          node.on("dragmove.smartguides", () => {
            console.log("拖拽移动事件触发", {
              hasOnGuidesChange: !!onGuidesChange,
              hasOnDragStateChange: !!onDragStateChange,
              selectedCount: selectedElements.length,
            });

            if (selectedElements.length === 1 && onGuidesChange && onDragStateChange) {
              const element = selectedElements[0];
              // 创建临时元素对象用于计算对齐
              const tempElement = {
                ...element,
                x: node.x(),
                y: node.y(),
              };

              console.log("计算对齐线", {
                tempElement: { id: tempElement.id, x: tempElement.x, y: tempElement.y },
                allElementsCount: allElements.length,
              });

              const { guides: newGuides, snappedPosition } = calculateSmartGuides(
                tempElement,
                allElements,
                5 // 5px 吸附阈值
              );

              console.log("计算结果", {
                guidesCount: newGuides.length,
                guides: newGuides,
                snappedPosition,
              });

              // 应用吸附
              if (snappedPosition.x !== undefined || snappedPosition.y !== undefined) {
                console.log("应用吸附", snappedPosition);
                if (snappedPosition.x !== undefined) {
                  node.x(snappedPosition.x);
                }
                if (snappedPosition.y !== undefined) {
                  node.y(snappedPosition.y);
                }
                node.getLayer()?.batchDraw();
              }

              onDragStateChange(true);
              onGuidesChange(newGuides);
            }
          });

          node.off("dragend.smartguides");
          node.on("dragend.smartguides", () => {
            if (onGuidesChange && onDragStateChange) {
              onGuidesChange([]);
              onDragStateChange(false);
            }
          });
        });

        transformer.nodes(nodes);
        transformer.getLayer()?.batchDraw();
      });
    });

    // 清理函数
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [selectedElements, allElements]); // 添加 allElements 依赖

  // 处理拖拽结束 - 通过 Transformer 或元素拖动
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    console.log("Transformer handleDragEnd 触发", e.target);
    if (onGuidesChange && onDragStateChange) {
      onGuidesChange([]);
      onDragStateChange(false);
    }

    if (!onTransformEnd) return;

    const transformer = transformerRef.current;
    if (!transformer) return;

    const nodes = transformer.nodes();
    console.log("当前绑定的节点:", nodes.length);

    nodes.forEach((node) => {
      const elementId = node.id().replace("node-", "");
      console.log("更新位置:", { elementId, x: node.x(), y: node.y() });
      onTransformEnd(elementId, {
        x: node.x(),
        y: node.y(),
      });
    });
  };

  // 处理变换结束 - 缩放/旋转
  const handleTransformEnd = (_e: Konva.KonvaEventObject<DragEvent | MouseEvent | TouchEvent>) => {
    console.log("Transformer onTransformEnd 触发");
    if (onGuidesChange && onDragStateChange) {
      onGuidesChange([]);
      onDragStateChange(false);
    }

    if (!onTransformEnd) return;

    const transformer = transformerRef.current;
    if (!transformer) return;

    const nodes = transformer.nodes();

    nodes.forEach((node) => {
      const elementId = node.id().replace("node-", "");

      // 获取当前的属性
      const rotation = node.rotation();
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // 如果有缩放，应用到 width/height 并重置 scale
      if (scaleX !== 1 || scaleY !== 1) {
        const newWidth = node.width() * scaleX;
        const newHeight = node.height() * scaleY;

        node.scaleX(1);
        node.scaleY(1);
        node.width(newWidth);
        node.height(newHeight);

        onTransformEnd(elementId, {
          width: newWidth,
          height: newHeight,
          rotation,
          scaleX: 1,
          scaleY: 1,
        });
      } else {
        onTransformEnd(elementId, {
          rotation,
        });
      }
    });
  };

  if (selectedElements.length === 0) {
    return null;
  }

  // 处理拖拽移动 - 实时计算对齐线
  const handleDragMove = useCallback(() => {
    console.log("Transformer handleDragMove 触发");
    if (!onGuidesChange || !onDragStateChange || selectedElements.length !== 1) {
      console.log("handleDragMove 条件不满足", {
        hasOnGuidesChange: !!onGuidesChange,
        hasOnDragStateChange: !!onDragStateChange,
        selectedCount: selectedElements.length,
      });
      return;
    }

    const transformer = transformerRef.current;
    if (!transformer) return;

    const nodes = transformer.nodes();
    if (nodes.length === 0) return;

    const node = nodes[0];
    const element = selectedElements[0];

    console.log("计算对齐线 (from Transformer)", {
      elementId: element.id,
      nodeX: node.x(),
      nodeY: node.y(),
    });

    // 创建临时元素对象用于计算对齐
    const tempElement = {
      ...element,
      x: node.x(),
      y: node.y(),
    };

    const { guides: newGuides, snappedPosition } = calculateSmartGuides(
      tempElement,
      allElements,
      5 // 5px 吸附阈值
    );

    console.log("Transformer 计算结果", {
      guidesCount: newGuides.length,
      guides: newGuides,
      snappedPosition,
    });

    // 应用吸附
    if (snappedPosition.x !== undefined || snappedPosition.y !== undefined) {
      console.log("应用吸附 (from Transformer)", snappedPosition);
      if (snappedPosition.x !== undefined) {
        node.x(snappedPosition.x);
      }
      if (snappedPosition.y !== undefined) {
        node.y(snappedPosition.y);
      }
      node.getLayer()?.batchDraw();
    }

    onDragStateChange(true);
    onGuidesChange(newGuides);
  }, [selectedElements, allElements, onGuidesChange, onDragStateChange]);

  return (
    <Transformer
      ref={transformerRef}
      onDragEnd={handleDragEnd}
      onDragMove={handleDragMove}
      onTransformEnd={handleTransformEnd}
      boundBoxFunc={(oldBox, newBox) => {
        // 限制最小尺寸
        if (newBox.width < 20 || newBox.height < 20) {
          return oldBox;
        }
        return newBox;
      }}
      // 样式配置 - Canva 风格
      anchorSize={10}
      anchorCornerRadius={2}
      anchorStroke="#8b5cf6"
      anchorFill="#ffffff"
      borderStroke="#8b5cf6"
      borderDash={[4, 4]}
      // 启用所有变换功能
      enabledAnchors={[
        "top-left",
        "top-center",
        "top-right",
        "middle-left",
        "middle-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
      ]}
      // 旋转手柄
      rotateAnchorOffset={25}
      anchorStyleFunc={(anchor) => {
        if (anchor.name() === "rotate-anchor") {
          anchor.fill("#8b5cf6");
          anchor.stroke("#ffffff");
          anchor.scaleX(1.2);
          anchor.scaleY(1.2);
        }
      }}
      // 保持比例 Shift 键
      keepRatio={false}
      // 允许旋转
      rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
      rotationSnapTolerance={5}
      // 重要：允许通过拖拽元素本身来移动
      ignoreStroke={false}
    />
  );
}
