// frontend/src/components/AIChat.jsx
import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Bot, Send, Sparkles } from "lucide-react";
import api from "../api/api"; // <-- use shared axios instance

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I’m your Campus AI Assistant. Ask me about events, organizations, announcements, or where to find help on campus.",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll when messages or open state change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Allow HomePage "Try AI Assistant" button to open the chat
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-ai-assistant", handler);
    return () => window.removeEventListener("open-ai-assistant", handler);
  }, []);

  const sendToBackend = async (userText) => {
    setIsLoading(true);
    try {
      // Use shared axios instance; baseURL + auth handled in api.js
      const res = await api.post("/api/assistant/chat", {
        message: userText,
        history: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const replyText =
        res.data?.reply ||
        "Sorry, I couldn’t generate a response right now. Please try again.";

      const aiMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: replyText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Assistant error:", err);
      const errorMessage = {
        id: `${Date.now()}-error`,
        role: "assistant",
        content:
          "There was a problem talking to the Campus Assistant. Please check your connection or try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    await sendToBackend(userText);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl z-50"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <div>Campus AI Assistant</div>
              <div className="text-xs text-muted-foreground">
                Powered by Gemini 2.5 Flash
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-muted-foreground">
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Input bar */}
          <form
            onSubmit={handleSubmit}
            className="border-t px-3 py-3 flex items-center gap-2"
          >
            <Input
              placeholder="Ask about events, organizations, or campus help…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>

          <div className="text-xs text-muted-foreground mt-1 mb-2 text-center px-3">
            Answers may not always be perfectly accurate. For official policies,
            check your campus website or contact staff directly.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
