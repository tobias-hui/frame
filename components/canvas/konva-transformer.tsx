"use client";

import type Konva from "konva";
import { useEffect, useRef } from "react";
import { Transformer } from "react-konva";
import type { CanvasElement } from "@/lib/store/canvas-store";

interface KonvaTransformerProps {
  selectedElements: CanvasElement[];
  onTransformEnd?: (elementId: string, attrs: Partial<Konva.NodeConfig>) => void;
}

export function KonvaTransformer({ selectedElements, onTransformEnd }: KonvaTransformerProps) {
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
          console.log("节点配置:", {
            id: node.id(),
            draggable: node.draggable(),
            dragDistance: node.dragDistance(),
            listening: node.listening(),
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
  }, [selectedElements]); // 只依赖 selectedElements，不依赖 onTransformEnd

  // 处理拖拽结束 - 通过 Transformer 或元素拖动
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    console.log("Transformer handleDragEnd 触发", e.target);
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

  return (
    <Transformer
      ref={transformerRef}
      onDragEnd={handleDragEnd}
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
