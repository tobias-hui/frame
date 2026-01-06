"use client";

import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { CanvasToolbar } from "@/components/canvas/canvas-toolbar";
import { KonvaDesignCanvas } from "@/components/canvas/konva-design-canvas";
import { ChatBox } from "@/components/chat/chatbox";

export default function Home() {
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  return (
    <div className="relative flex h-screen w-screen">
      {/* Left - Canvas Area (takes remaining space) */}
      <div className="flex-1 overflow-hidden">
        <KonvaDesignCanvas />
      </div>

      {/* Right - ChatBox fixed on the right side */}
      {isChatCollapsed ? (
        <div className="flex-shrink-0 border-l border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setIsChatCollapsed(false)}
            className="h-full w-8 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Expand chat"
          >
            <ChevronLeft className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>
      ) : (
        <div className="w-96 flex-shrink-0 border-l border-zinc-200 dark:border-zinc-800">
          <ChatBox
            className="h-full rounded-l-lg"
            onToggleCollapse={() => setIsChatCollapsed(true)}
          />
        </div>
      )}

      {/* Floating Toolbar - positioned on left side, vertically centered */}
      <div className="absolute left-4 top-1/2 z-50 -translate-y-1/2">
        <CanvasToolbar />
      </div>
    </div>
  );
}
