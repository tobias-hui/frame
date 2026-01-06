import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";

// 简化的元素数据结构 - 分离存储各个属性
export interface CanvasElement {
  id: string;

  // 位置 (绝对定位)
  x: number;
  y: number;

  // 尺寸
  width: number;
  height: number;

  // 变换 (分离存储)
  rotation?: number; // 旋转角度 (度)
  scaleX?: number; // X轴缩放
  scaleY?: number; // Y轴缩放

  // 层级和透明度
  zIndex?: number;
  opacity?: number;

  // 视觉样式
  backgroundColor?: string;
  borderRadius?: string;
  border?: string;

  // 文本相关样式
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: string;
  fontFamily?: string;

  // 元素类型和内容
  type: "text" | "image" | "shape" | "container" | "button";
  content?: string;
  src?: string;

  // 嵌套子元素
  children?: CanvasElement[];

  // 元素属性
  locked?: boolean;
  visible?: boolean;
  name?: string;
}

// 画布尺寸配置
export const CANVAS_CONFIG = {
  width: 1200,
  height: 675,
  aspectRatio: "16/9",
} as const;

interface CanvasStore {
  elements: CanvasElement[];
  selectedIds: string[];
  clipboard: CanvasElement[] | null;

  addElement: (element: Omit<CanvasElement, "id">) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  setSelectedIds: (ids: string[]) => void;
  clearCanvas: () => void;
  getElement: (id: string) => CanvasElement | undefined;

  // Copy & Paste
  copyElements: (ids: string[]) => void;
  pasteElements: () => void;
  duplicateElements: (ids: string[]) => void;

  // Layer management
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  moveLayer: (id: string, direction: "up" | "down") => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  elements: [],
  selectedIds: [],
  clipboard: null,

  addElement: (element) => {
    const newElement: CanvasElement = {
      ...element,
      id: uuidv4(),
      // 默认值
      rotation: element.rotation ?? 0,
      scaleX: element.scaleX ?? 1,
      scaleY: element.scaleY ?? 1,
      opacity: element.opacity ?? 1,
      zIndex: element.zIndex ?? 1,
    };
    set((state) => ({
      elements: [...state.elements, newElement],
      selectedIds: [newElement.id],
    }));
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
    }));
  },

  deleteElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    }));
  },

  setSelectedIds: (ids) => {
    set({ selectedIds: ids });
  },

  clearCanvas: () => {
    set({ elements: [], selectedIds: [] });
  },

  getElement: (id) => {
    return get().elements.find((el) => el.id === id);
  },

  // Copy & Paste
  copyElements: (ids) => {
    const elements = get().elements;
    const toCopy = ids
      .map((id) => elements.find((el) => el.id === id))
      .filter((el): el is CanvasElement => el !== undefined);
    set({ clipboard: toCopy });
  },

  pasteElements: () => {
    const { clipboard, elements } = get();
    if (!clipboard || clipboard.length === 0) return;

    // Offset pasted elements by 20px
    const newElements = clipboard.map((el) => {
      const newEl: CanvasElement = {
        ...el,
        id: uuidv4(),
        x: el.x + 20,
        y: el.y + 20,
        zIndex: Math.max(...elements.map((e) => e.zIndex || 0)) + 1,
      };
      return newEl;
    });

    set((state) => ({
      elements: [...state.elements, ...newElements],
      selectedIds: newElements.map((el) => el.id),
    }));
  },

  duplicateElements: (ids) => {
    const { elements } = get();
    const toDuplicate = ids
      .map((id) => elements.find((el) => el.id === id))
      .filter((el): el is CanvasElement => el !== undefined);

    // Offset duplicated elements by 20px
    const newElements = toDuplicate.map((el) => {
      const newEl: CanvasElement = {
        ...el,
        id: uuidv4(),
        x: el.x + 20,
        y: el.y + 20,
        zIndex: Math.max(...elements.map((e) => e.zIndex || 0)) + 1,
      };
      return newEl;
    });

    set((state) => ({
      elements: [...state.elements, ...newElements],
      selectedIds: newElements.map((el) => el.id),
    }));
  },

  // Layer management
  bringToFront: (id) => {
    const { elements } = get();
    const element = elements.find((el) => el.id === id);
    if (!element) return;

    const maxZ = Math.max(...elements.map((el) => el.zIndex || 0));
    set((state) => ({
      elements: state.elements.map((el) => (el.id === id ? { ...el, zIndex: maxZ + 1 } : el)),
    }));
  },

  sendToBack: (id) => {
    const { elements } = get();
    const element = elements.find((el) => el.id === id);
    if (!element) return;

    const minZ = Math.min(...elements.map((el) => el.zIndex || 0));
    set((state) => ({
      elements: state.elements.map((el) => (el.id === id ? { ...el, zIndex: minZ - 1 } : el)),
    }));
  },

  moveLayer: (id, direction) => {
    const { elements } = get();
    const element = elements.find((el) => el.id === id);
    if (!element) return;

    const currentIndex = elements.findIndex((el) => el.id === id);
    if (currentIndex === -1) return;

    const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const currentZ = element.zIndex || 0;

    if (direction === "up") {
      // Find next higher zIndex
      const aboveElements = sortedElements.filter((el) => (el.zIndex || 0) > currentZ);
      if (aboveElements.length > 0) {
        const nextZ = Math.min(...aboveElements.map((el) => el.zIndex || 0));
        set((state) => ({
          elements: state.elements.map((el) => (el.id === id ? { ...el, zIndex: nextZ } : el)),
        }));
      }
    } else {
      // Find next lower zIndex
      const belowElements = sortedElements.filter((el) => (el.zIndex || 0) < currentZ);
      if (belowElements.length > 0) {
        const prevZ = Math.max(...belowElements.map((el) => el.zIndex || 0));
        set((state) => ({
          elements: state.elements.map((el) => (el.id === id ? { ...el, zIndex: prevZ } : el)),
        }));
      }
    }
  },
}));
