"use client";

import { cn } from "../lib/utils";

interface MainTMSLogoProps {
  variant?: "full" | "ai-only";
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function MainTMSLogo({ variant = "full", className, size = "md" }: MainTMSLogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
    xl: "h-12",
  };

  return (
    <img
      src="/maintms-logo.png"
      alt="MainTMS"
      className={cn("object-contain", sizeClasses[size], className)}
    />
  );
}

// Hook for replacing text content
export function useMainTMSReplacement() {
  if (typeof window === "undefined") return;

  const replaceTextNodes = () => {
    const TARGET = "Main Tms";
    
    function createFullLogo() {
      const wrap = document.createElement("span");
      wrap.className = "main-tms-logo";
      wrap.innerHTML = `
        <span class="main-tms-text">MAIN</span>
        <span class="main-tms-ai">
          AI
          <span class="main-tms-dot"></span>
        </span>
        <span class="main-tms-sub">TMS</span>
      `;
      return wrap;
    }

    function createAILogo() {
      const ai = document.createElement("span");
      ai.className = "main-ai-only";
      ai.textContent = "AI";
      return ai;
    }

    function shouldUseAIOnly(node: Node) {
      const parent = node.parentElement;
      if (!parent) return false;
      return parent.offsetWidth > 0 && parent.offsetWidth < 140;
    }

    function replaceNode(textNode: Node) {
      const text = textNode.nodeValue;
      if (!text || !text.includes(TARGET)) return;

      const parent = textNode.parentNode;
      if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.nodeName)) return;

      const parts = text.split(TARGET);
      const frag = document.createDocumentFragment();

      parts.forEach((part, i) => {
        if (part) frag.appendChild(document.createTextNode(part));
        if (i < parts.length - 1) {
          frag.appendChild(
            shouldUseAIOnly(textNode) ? createAILogo() : createFullLogo()
          );
        }
      });

      parent.replaceChild(frag, textNode);
    }

    function scan(root: Node = document.body) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes: Node[] = [];
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue?.includes(TARGET)) {
          nodes.push(node);
        }
      }
      nodes.forEach(replaceNode);
    }

    // Initial scan
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => scan());
    } else {
      scan();
    }

    // Watch for dynamic changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 3) replaceNode(n);
          if (n.nodeType === 1) scan(n);
        });
      });
    });
    
    observer.observe(document.documentElement, { childList: true, subtree: true });

    return () => observer.disconnect();
  };

  return replaceTextNodes;
}
