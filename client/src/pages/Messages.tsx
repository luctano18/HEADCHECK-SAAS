/**
 * Messages.tsx
 * Secure messaging between facilitators and students.
 * Facilitators can start conversations with any student in their institution.
 * Students can only view and reply to existing conversations.
 */
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppSidebar from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle, Send, ArrowLeft, User, Lock,
  Loader2, ChevronRight, Plus, Clock,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";

function formatMessageTime(date: Date | string) {
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

function formatConvTime(date: Date | string) {
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

// ─── Conversation List ────────────────────────────────────────────────────────
function ConversationList({
  onSelect,
  selectedId,
}: {
  onSelect: (id: number) => void;
  selectedId: number | null;
}) {
  const { user } = useAuth();
  const { data: convs, isLoading } = trpc.messages.getConversations.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const isFacilitator = ["facilitator", "admin", "superadmin"].includes(user?.role ?? "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading conversations…</span>
      </div>
    );
  }

  if (!convs || convs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <MessageCircle className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
        <p className="text-sm font-medium text-muted-foreground">No conversations yet</p>
        {isFacilitator && (
          <p className="text-xs text-muted-foreground mt-1">
            Start a conversation with a student from their profile.
          </p>
        )}
        {!isFacilitator && (
          <p className="text-xs text-muted-foreground mt-1">
            A facilitator will reach out to you here.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {convs.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3 ${
            selectedId === conv.id ? "bg-violet-50 border-r-2 border-violet-500" : ""
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold truncate">{conv.otherName}</p>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                {formatConvTime(conv.lastMessageAt)}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                {conv.otherRole}
              </Badge>
              {conv.subject && (
                <span className="text-xs text-muted-foreground truncate">{conv.subject}</span>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      ))}
    </div>
  );
}

// ─── Chat Window ──────────────────────────────────────────────────────────────
function ChatWindow({ conversationId }: { conversationId: number }) {
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: msgs, isLoading } = trpc.messages.getMessages.useQuery(
    { conversationId },
    { refetchInterval: 5000 }
  );

  const sendMutation = trpc.messages.sendMessage.useMutation({
    onSuccess: () => {
      setDraft("");
      utils.messages.getMessages.invalidate({ conversationId });
      utils.messages.getConversations.invalidate();
      utils.messages.getUnreadCount.invalidate();
    },
    onError: (err) => toast.error(`Failed to send: ${err.message}`),
  });

  // Scroll to bottom when messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content) return;
    sendMutation.mutate({ conversationId, content });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading messages…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs && msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Lock className="w-8 h-8 text-muted-foreground opacity-40 mb-2" />
            <p className="text-sm text-muted-foreground">
              This conversation is private and encrypted.
            </p>
            <p className="text-xs text-muted-foreground mt-1">Say hello to get started.</p>
          </div>
        )}
        {msgs?.map((msg) => {
          const isOwn = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  isOwn
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    isOwn ? "text-violet-200" : "text-muted-foreground"
                  }`}
                >
                  {formatMessageTime(msg.createdAt)}
                  {isOwn && (
                    <span className="ml-1">{msg.read ? "✓✓" : "✓"}</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3 bg-background">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 resize-none border border-input rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[40px] max-h-[120px] overflow-y-auto"
            style={{ height: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || sendMutation.isPending}
            size="icon"
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-10 w-10 shrink-0"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Messages are private and visible only to you and your facilitator.
        </p>
      </div>
    </div>
  );
}

// ─── Main Messages Page ───────────────────────────────────────────────────────
export default function Messages() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const handleSelectConv = (id: number) => {
    setSelectedConvId(id);
    setMobileView("chat");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please sign in to access messages.</p>
      </div>
    );
  }

  return (
    <AppSidebar>
      {/* Header */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          {mobileView === "chat" && selectedConvId ? (
            <button
              onClick={() => setMobileView("list")}
              className="md:hidden p-1.5 rounded-lg hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => navigate("/")}
              className="p-1.5 rounded-lg hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-violet-600" />
            <h1 className="text-lg font-bold">Messages</h1>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Private & Secure</span>
          </div>
        </div>
      </div>

      {/* Layout */}
      {/*
        Height accounts for chrome outside this page that isn't part of the
        old 57px-header assumption: AppSidebar's <main> wraps every page in
        p-4 (16px top + 16px bottom = 32px), and on mobile it also renders
        its own 56px sticky top bar above this page's content. So:
          desktop: 100vh - 57px (this page's sticky header) - 32px (AppSidebar's p-4) = 100vh - 89px
          mobile:  100vh - 57px - 32px - 56px (AppSidebar's mobile top bar) = 100vh - 145px
        Verified empirically via rendered bounding rects at 1280px and 390px widths.
      */}
      <div className="max-w-5xl mx-auto flex h-[calc(100vh-145px)] md:h-[calc(100vh-89px)]">
        {/* Conversation list — hidden on mobile when chat is open */}
        <div
          className={`w-full md:w-80 border-r border-border bg-background flex-shrink-0 overflow-y-auto ${
            mobileView === "chat" ? "hidden md:block" : "block"
          }`}
        >
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Conversations
            </p>
          </div>
          <ConversationList onSelect={handleSelectConv} selectedId={selectedConvId} />
        </div>

        {/* Chat window */}
        <div
          className={`flex-1 flex flex-col ${
            mobileView === "list" ? "hidden md:flex" : "flex"
          }`}
        >
          {selectedConvId ? (
            <ChatWindow conversationId={selectedConvId} />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
              <MessageCircle className="w-12 h-12 text-muted-foreground opacity-30 mb-4" />
              <h2 className="text-base font-semibold text-muted-foreground">
                Select a conversation
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a conversation from the list to start messaging.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppSidebar>
  );
}
