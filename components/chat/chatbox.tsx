"use client";

import { AtSign, ChevronRight, Paperclip, Send } from "lucide-react";
import { useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatBoxProps {
  className?: string;
  onToggleCollapse?: () => void;
}

export function ChatBox({ className, onToggleCollapse }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    // TODO: 调用 AI API
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col bg-white shadow-xl dark:bg-zinc-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Chat</h2>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          aria-label="Collapse chat"
        >
          <ChevronRight className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Start a conversation to begin creating...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : "bg-blue-50 dark:bg-blue-900/20"
                  }`}
                >
                  <p className="text-sm text-zinc-900 dark:text-zinc-100">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Start with an idea, or type "@" to mention'
            className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-4 py-3 pr-20 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            rows={3}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              type="button"
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <AtSign className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              className="rounded bg-blue-600 p-1.5 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
