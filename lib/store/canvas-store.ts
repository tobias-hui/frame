import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

// 完全对齐 CSS 属性的数据结构
// AI 可以直接生成这些样式属性来控制元素
export interface CanvasElement {
  id: string;

  // CSS 属性对齐 - 用于 AI 生成
  style: {
    // Position
    left: string;  // e.g., "100px"
    top: string;   // e.g., "200px"
    // Size
    width: string;   // e.g., "300px"
    height: string;  // e.g., "200px" or "auto"
    // Transform (for rotation, scale)
    transform?: string;  // e.g., "rotate(45deg) scale(1.5)"
    // Z-index
    zIndex?: number;
    // Opacity
    opacity?: number;
    // Border radius
    borderRadius?: string;
    // Background
    backgroundColor?: string;
    // Border
    border?: string;
    // Text styles
    color?: string;
    fontSize?: string;
    fontWeight?: string;
    textAlign?: string;
    fontFamily?: string;
    lineHeight?: string;
    letterSpacing?: string;
  };

  // 元素类型和内容
  type: "text" | "image" | "shape" | "container" | "button";
  content?: string;  // text content
  src?: string;      // image source

  // 嵌套子元素（可选，支持容器类型）
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
  // 所有元素
  elements: CanvasElement[];

  // 当前选中的元素 ID 列表（支持多选）
  selectedIds: string[];

  // 当前操作的元素（用于 Moveable）
  targetElements: CanvasElement[];

  // 添加元素
  addElement: (element: Omit<CanvasElement, "id">) => void;

  // 更新元素（AI 可以直接调用）
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;

  // 批量更新元素
  updateElements: (ids: string[], updates: Partial<CanvasElement>) => void;

  // 删除元素
  deleteElement: (id: string) => void;

  // 选中/取消选中
  setSelectedIds: (ids: string[]) => void;

  // 清空画布
  clearCanvas: () => void;

  // 更新元素的样式（AI 友好接口）
  updateElementStyle: (
    id: string,
    style: Partial<CanvasElement["style"]>
  ) => void;

  // 批量更新样式
  batchUpdateStyles: (
    updates: Array<{ id: string; style: Partial<CanvasElement["style"]> }>
  ) => void;

  // 获取元素
  getElement: (id: string) => CanvasElement | undefined;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  elements: [],
  selectedIds: [],
  targetElements: [],

  addElement: (element) => {
    const newElement: CanvasElement = {
      ...element,
      id: uuidv4(),
    };
    set((state) => ({
      elements: [...state.elements, newElement],
      selectedIds: [newElement.id],
    }));
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  },

  updateElements: (ids, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        ids.includes(el.id) ? { ...el, ...updates } : el
      ),
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
    // 更新 targetElements
    const { elements } = get();
    set({
      targetElements: elements.filter((el) => ids.includes(el.id)),
    });
  },

  clearCanvas: () => {
    set({ elements: [], selectedIds: [], targetElements: [] });
  },

  updateElementStyle: (id, style) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id
          ? { ...el, style: { ...el.style, ...style } }
          : el
      ),
    }));
  },

  batchUpdateStyles: (updates) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        const update = updates.find((u) => u.id === el.id);
        if (update) {
          return {
            ...el,
            style: { ...el.style, ...update.style },
          };
        }
        return el;
      }),
    }));
  },

  getElement: (id) => {
    return get().elements.find((el) => el.id === id);
  },
}));
