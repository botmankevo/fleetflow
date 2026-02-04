"use client";

import { useState } from "react";
import { Bot, X, Send, Sparkles, Zap, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your MainTMS AI Co-Pilot. I can help you manage loads, dispatch drivers, analyze performance, and answer questions. What would you like to do?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const quickActions = [
    { icon: Zap, label: "Create Load", action: "create-load" },
    { icon: TrendingUp, label: "Show Analytics", action: "analytics" },
    { icon: AlertCircle, label: "Check Alerts", action: "alerts" },
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Call AI backend
    try {
      const response = await fetch("http://localhost:8000/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          message: input,
          context: { page: "copilot" },
        }),
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        role: "assistant",
        content: data.response || "I'm having trouble processing that. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI request failed:", error);
      const aiMessage: Message = {
        role: "assistant",
        content: "I'm currently experiencing connectivity issues. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl shadow-2xl transition-all duration-300 group",
          isOpen
            ? "bg-destructive hover:bg-destructive/90"
            : "gradient-bg-main hover:scale-110 glow-primary"
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white mx-auto" />
        ) : (
          <div className="relative">
            <Bot className="w-6 h-6 text-white mx-auto group-hover:scale-110 transition-transform" />
            <Sparkles className="w-3 h-3 text-accent absolute -top-1 -right-1 animate-pulse" />
          </div>
        )}
      </button>

      {/* Copilot Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 w-96 h-[600px] rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden",
          "bg-card border border-glass-border backdrop-blur-xl",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="relative p-4 border-b border-glass-border gradient-bg-main overflow-hidden">
          <div className="absolute inset-0 gradient-animated opacity-30"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold ai-text">AI Co-Pilot</h3>
                <p className="text-white/80 text-xs">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-accent rounded-full pulse-glow-accent"></span>
              <span className="text-white/80 text-xs font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-3 border-b border-glass-border bg-secondary/30">
          <div className="flex gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.action}
                  onClick={() => setInput(action.label)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-background hover:bg-primary/10 border border-glass-border hover:border-primary/30 transition-all group"
                >
                  <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    {action.label.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[400px] custom-scrollbar">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  msg.role === "assistant"
                    ? "gradient-bg-main"
                    : "bg-secondary"
                )}
              >
                {msg.role === "assistant" ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-xs font-bold text-foreground">You</span>
                )}
              </div>
              <div
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg text-sm",
                  msg.role === "assistant"
                    ? "bg-secondary/50 text-foreground"
                    : "gradient-bg-main text-white"
                )}
              >
                <p className="leading-relaxed">{msg.content}</p>
                <span className="text-xs opacity-60 mt-1 block">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg gradient-bg-main flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="px-3 py-2 rounded-lg bg-secondary/50">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-glass-border bg-background/50 backdrop-blur-sm">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-secondary/50 border border-glass-border focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-sm outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4 py-2.5 rounded-xl gradient-bg-main text-white font-medium hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0, 163, 255, 0.2);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 163, 255, 0.4);
          }
        `}</style>
      </div>
    </>
  );
}
