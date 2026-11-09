import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router";
import LandingPage from "./LandingPage";
import GuardrailModal from "./GuardrailModal";
import DemoModal from "./DemoModal";
import AuthModal, { AuthMode, AuthPayload, AuthUser } from "./AuthModal";
import { api, ChatResponse } from "./api";
import PaymentPage from "./pages/PaymentPage";
import SuccessPage from "./pages/SuccessPage";
import CancelPage from "./pages/CancelPage";
import AutonomyPage from "./pages/AutonomyPage";
import OrdersModal from "./OrdersModal";
import { formatPennyMessage, parseReceiptFromText } from "./utils/formatMarkdown";
import { pennyLogo, paypalLogo } from "./assets";

export type View =
  | "landing"
  | "chat"
  | "review"
  | "payment"
  | "success"
  | "cancel"
  | "autonomy";

type IconName =
  | "arrow"
  | "back"
  | "bag"
  | "card"
  | "check"
  | "chevron"
  | "clock"
  | "copy"
  | "edit"
  | "external"
  | "lock"
  | "minus"
  | "plus"
  | "send"
  | "settings"
  | "shield"
  | "sparkles"
  | "trash"
  | "user"
  | "x";

type Guardrails = {
  mode: "shop-with-me" | "buy-for-me";
};

type ToastItem = {
  id: number;
  message: string;
  tone: "success" | "info" | "error";
};

type ChatMessage = {
  id: string;
  role: "user" | "penny";
  content: string;
  imageUrl?: string;
  fileName?: string;
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    back: <path d="M19 12H5M11 18l-6-6 6-6" />,
    bag: (
      <>
        <path d="M5 8h14l-1 12H6L5 8Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </>
    ),
    card: (
      <>
        <rect height="14" rx="2" width="18" x="3" y="5" />
        <path d="M3 10h18" />
      </>
    ),
    check: <path d="m5 12 4 4L19 7" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    copy: (
      <>
        <rect height="11" rx="2" width="11" x="8" y="8" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </>
    ),
    edit: (
      <>
        <path d="m4 16-1 5 5-1L19 9l-4-4L4 16Z" />
        <path d="m13 7 4 4" />
      </>
    ),
    external: (
      <>
        <path d="M14 4h6v6M20 4l-9 9" />
        <path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" />
      </>
    ),
    lock: (
      <>
        <rect height="10" rx="2" width="14" x="5" y="10" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    plus: <path d="M12 5v14M5 12h14" />,
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4 20-7Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    settings: (
      <>
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" />
      </>
    ),
    shield: <path d="M12 3 5 6v5c0 4.8 3 8.1 7 10 4-1.9 7-5.2 7-10V6l-7-3Z" />,
    sparkles: (
      <>
        <path d="m12 3 1.2 3.3L16.5 8l-3.3 1.2L12 12.5l-1.2-3.3L7.5 8l3.3-1.7L12 3Z" />
        <path d="m18 13 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    x: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      >
        {paths[name]}
      </g>
    </svg>
  );
}

function viewFromPath(pathname: string): View {
  const clean = pathname.replace(/\/+$/, "").toLowerCase() || "/";
  if (clean === "/chat") return "chat";
  if (clean === "/review") return "review";
  if (clean === "/checkout" || clean === "/payment") return "payment";
  if (
    clean === "/order/success" ||
    clean === "/orders/success" ||
    clean === "/order" ||
    clean === "/orders" ||
    clean.startsWith("/order/success") ||
    clean.startsWith("/orders/success") ||
    clean.startsWith("/order") ||
    clean.startsWith("/orders")
  )
    return "success";
  if (clean === "/checkout/cancel" || clean === "/payment/cancel")
    return "cancel";
  if (clean === "/autonomy" || clean.startsWith("/autonomy")) return "autonomy";
  return "landing";
}

const suggestions = [
  "Find me wireless noise cancelling headphones under $150",
  "Help me compare top running shoes for marathons",
  "I need an ergonomic mechanical keyboard for typing",
];

const visualSuggestions = [
  {
    title: "Noise Cancelling Headphones",
    query: "Find me wireless noise cancelling headphones under $150",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=240&q=80",
    badge: "Under $150",
  },
  {
    title: "Marathon Running Shoes",
    query:
      "Help me compare top running shoes for marathons with high arch support",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=240&q=80",
    badge: "High Cushion",
  },
  {
    title: "Ergonomic Mechanical Keyboard",
    query:
      "I need an ergonomic mechanical keyboard for typing with quiet switches",
    image:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=240&q=80",
    badge: "Tactile",
  },
];

function Header({
  goTo,
  onCustomize,
  onOpenDemo,
  onOpenOrders,
  onSignIn,
  onSignUp,
  onSignOut,
  user,
  view,
}: {
  goTo: (view: View) => void;
  onCustomize: () => void;
  onOpenDemo: () => void;
  onOpenOrders: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onSignOut: () => void;
  user: AuthUser | null;
  view: View;
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="wordmark"
          onClick={() => {
            goTo("landing");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          title="Go to Home"
          type="button"
        >
          <span className="wordmark-icon">
            <img src={pennyLogo} alt="Penny Logo" className="penny-logo-mark" />
          </span>
          Penny
        </button>

        {view === "landing" && (
          <nav className="header-nav-links">
            <a href="#how">How it works</a>
            <a href="#control">Your control</a>
            <a href="#autonomy">Autonomous payments</a>
          </nav>
        )}
      </div>

      <div className="header-demo-center">
        <button
          className="demo-trigger-button"
          onClick={onOpenDemo}
          title="See an interactive demo of how Penny works"
          type="button"
        >
          <span className="demo-trigger-pill">SYSTEM DEMO</span>
          <span className="demo-trigger-label">How Penny Works</span>
          <Icon name="sparkles" size={14} />
        </button>
      </div>

      <div className="header-actions">
        {user ? (
          <>
            {view === "landing" && (
              <button
                className="header-chat-cta"
                onClick={() => goTo("chat")}
                title="Go to Penny Conversation"
                type="button"
              >
                <span>Go to Chat</span>
                <Icon name="arrow" size={12} />
              </button>
            )}

            <button
              className="header-icon-action"
              onClick={onOpenOrders}
              title="View Your Orders"
              type="button"
            >
              <Icon name="bag" size={14} />
              <span className="header-action-text">Orders</span>
            </button>

            <button
              aria-label="Customize shopping preferences"
              className="header-icon-action"
              onClick={onCustomize}
              title="Shopping Preferences"
              type="button"
            >
              <Icon name="settings" size={14} />
              <span className="header-action-text">Preferences</span>
            </button>

            <div style={{ position: "relative" }}>
              <button
                aria-label={user ? `${user.firstName}'s account` : "Account"}
                className="profile-button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                title={
                  user?.email ? `${user.email} (click to view)` : "Account"
                }
                type="button"
              >
                {user
                  ? `${user.firstName[0] || ""}${user.lastName[0] || ""}`.toUpperCase()
                  : "AM"}
              </button>

              {profileMenuOpen && (
                <div className="header-profile-dropdown">
                  <div className="profile-dropdown-user">
                    <div className="profile-dropdown-name">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="profile-dropdown-email">{user.email}</div>
                  </div>

                  <div className="profile-dropdown-mobile-links">
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onOpenOrders();
                      }}
                      className="profile-dropdown-item"
                      type="button"
                    >
                      <Icon name="bag" size={13} /> Orders
                    </button>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onCustomize();
                      }}
                      className="profile-dropdown-item"
                      type="button"
                    >
                      <Icon name="settings" size={13} /> Preferences
                    </button>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onOpenDemo();
                      }}
                      className="profile-dropdown-item"
                      type="button"
                    >
                      <Icon name="sparkles" size={13} /> How Penny Works Demo
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onSignOut();
                    }}
                    className="profile-dropdown-signout"
                    type="button"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              className="header-demo-mini-btn"
              onClick={onOpenDemo}
              title="How Penny Works"
              type="button"
            >
              <Icon name="sparkles" size={12} />
              <span>Demo</span>
            </button>
            <button
              className="header-signin-btn"
              onClick={onSignIn}
              type="button"
            >
              Sign in
            </button>
            <button
              className="header-signup-btn"
              onClick={onSignUp}
              type="button"
            >
              Get started <Icon name="arrow" size={11} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function parsePendingOrderFromReply(
  reply: string,
  approvalUrl: string,
  mode: "shop-with-me" | "buy-for-me",
) {
  // 1. Try to extract total price from message
  let parsedTotal: number | null = null;
  const totalMatch =
    reply.match(
      /(?:total(?:\s+price)?|amount|subtotal)[:\s]*\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
    ) ||
    reply.match(/(?:price)[:\s]*\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/i) ||
    reply.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/i);

  if (totalMatch) {
    const val = parseFloat(totalMatch[1]);
    if (!isNaN(val) && val > 0) {
      parsedTotal = val;
    }
  }

  // 2. Try to extract line items from bullet points
  const items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }> = [];
  const lines = reply.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      if (
        !trimmed.toLowerCase().includes("http") &&
        !trimmed.toLowerCase().includes("paypal") &&
        !trimmed.toLowerCase().includes("status:")
      ) {
        const descMatch =
          trimmed.match(/(?:description|item)[:\s]*([^,\n]+)/i) ||
          trimmed.match(/^[-*]\s*(\*\*)?([^*\n,]+)/);
        const qtyMatch = trimmed.match(/quantity[:\s]*(\d+)/i);
        const priceMatch =
          trimmed.match(
            /(?:unit\s*price|price)[:\s]*\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
          ) || trimmed.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);

        if (descMatch) {
          const desc = descMatch[1]
            ? descMatch[1].replace(/^\*+|\*+$/g, "").trim()
            : "";
          if (
            desc &&
            !desc.toLowerCase().startsWith("total") &&
            !desc.toLowerCase().startsWith("order summary") &&
            desc.length > 2
          ) {
            const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
            const price = priceMatch
              ? parseFloat(priceMatch[1])
              : parsedTotal || 0;
            items.push({
              description: desc,
              quantity: isNaN(qty) ? 1 : qty,
              unitPrice: isNaN(price) ? parsedTotal || 0 : price,
            });
          }
        }
      }
    }
  }

  // Fallback if no items extracted: look for bolded product titles or product mentions
  if (items.length === 0) {
    const boldMatches = [...reply.matchAll(/\*\*([^*]+)\*\*/g)];
    const candidate = boldMatches.find(
      (m) =>
        !m[1].toLowerCase().includes("total") &&
        !m[1].toLowerCase().includes("order") &&
        !m[1].toLowerCase().includes("summary") &&
        !m[1].toLowerCase().includes("paypal") &&
        m[1].trim().length > 2,
    );
    const title = candidate ? candidate[1].trim() : "Penny Verified Item";
    items.push({
      description: title,
      quantity: 1,
      unitPrice: parsedTotal || 0,
    });
  }

  const finalTotal =
    parsedTotal ??
    (items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0) || 0);

  const tokenMatch = approvalUrl.match(/token=([a-zA-Z0-9_-]+)/);
  const orderId = tokenMatch
    ? `PAYPAL-${tokenMatch[1].slice(-8).toUpperCase()}`
    : `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

  return {
    orderId,
    paypalApprovalUrl: approvalUrl,
    totalPrice: finalTotal,
    currency: "USD",
    items: items.map((it) => ({
      ...it,
      unitPrice: it.unitPrice || finalTotal,
    })),
    mode,
  };
}

function ChatView({
  goTo,
  guardrails,
  onCustomize,
  onOpenDemo,
  onNotify,
  token,
  presetQuery,
  user,
  onOpenOrders,
}: {
  goTo: (view: View) => void;
  guardrails: Guardrails;
  onCustomize: () => void;
  onOpenDemo: () => void;
  onNotify: (message: string, tone?: ToastItem["tone"]) => void;
  token: string;
  presetQuery?: string;
  user?: AuthUser | null;
  onOpenOrders?: () => void;
}) {
  const [text, setText] = useState(presetQuery || "");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "intro-penny",
      role: "penny",
      content:
        "What are you looking for today?\nShare your budget, must-haves, or attach a product photo. I’ll search real merchant catalogs, compare options, and prepare your order.",
    },
  ]);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(Boolean(token));

  useEffect(() => {
    if (presetQuery) {
      setText(presetQuery);
    }
  }, [presetQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, sending, loadingHistory]);

  // Fetch persisted messages from GET /messages/own
  useEffect(() => {
    if (!token) {
      setLoadingHistory(false);
      return;
    }
    let active = true;
    setLoadingHistory(true);

    api
      .getMessages(token)
      .then((history) => {
        if (!active || !Array.isArray(history) || history.length === 0) return;

        // Sort chronologically ascending
        const sorted = [...history].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );

        const mapped: ChatMessage[] = sorted.map((item) => {
          const isUser = user?.id
            ? item.sender === user.id
            : item.sender !== "penny" &&
              !item.sender.toLowerCase().includes("assistant") &&
              !item.sender.toLowerCase().includes("agent");
          return {
            id: item.id || `msg-${Date.now()}-${Math.random()}`,
            role: isUser ? "user" : "penny",
            content: item.message,
          };
        });

        if (mapped.length > 0) {
          setChatMessages(mapped);
        }
      })
      .catch((err) => {
        console.warn("Could not load message history:", err);
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });

    return () => {
      active = false;
    };
  }, [token, user?.id]);

  // Inject any pending interaction (e.g. from Order Success "Continue with Penny" capture)
  useEffect(() => {
    if (!loadingHistory) {
      const raw = sessionStorage.getItem("penny_pending_chat_injection");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.userMessage && parsed?.pennyReply) {
            setChatMessages((prev) => {
              if (
                prev.some(
                  (m) =>
                    m.role === "penny" &&
                    m.content.trim() === parsed.pennyReply.trim(),
                )
              ) {
                return prev;
              }
              return [
                ...prev,
                {
                  id: `user-injected-${Date.now()}`,
                  role: "user",
                  content: parsed.userMessage,
                },
                {
                  id: `penny-injected-${Date.now() + 1}`,
                  role: "penny",
                  content: parsed.pennyReply,
                },
              ];
            });
          }
        } catch {
          // ignore
        } finally {
          sessionStorage.removeItem("penny_pending_chat_injection");
        }
      }
    }
  }, [loadingHistory]);

  async function handleClearHistory() {
    if (!token) {
      setChatMessages([
        {
          id: "intro-penny",
          role: "penny",
          content:
            "What are you looking for today?\nShare your budget, must-haves, or attach a product photo. I’ll search real merchant catalogs, compare options, and prepare your order.",
        },
      ]);
      onNotify("Conversation reset.", "info");
      return;
    }

    setClearing(true);
    try {
      await api.deleteMessages(token);
      setChatMessages([
        {
          id: "intro-penny",
          role: "penny",
          content:
            "What are you looking for today?\nShare your budget, must-haves, or attach a product photo. I’ll search real merchant catalogs, compare options, and prepare your order.",
        },
      ]);
      onNotify("All conversation history has been cleared.", "success");
    } catch {
      onNotify(
        "Could not clear conversation history. Please try again.",
        "error",
      );
    } finally {
      setClearing(false);
    }
  }

  // Subscribe to GET /agent/sse-stream to populate chat with streamed messages & order events
  useEffect(() => {
    const unsubscribe = api.subscribeSSE(
      (data) => {
        // 1. If incoming message / penny response is streamed
        const pennyText = data.penny || data.content || data.text;
        if (pennyText && typeof pennyText === "string") {
          setChatMessages((prev) => {
            const last = prev[prev.length - 1];
            if (
              last &&
              last.role === "penny" &&
              last.content.trim() === pennyText.trim()
            ) {
              return prev;
            }
            return [
              ...prev,
              {
                id: `penny-sse-${Date.now()}`,
                role: "penny",
                content: pennyText,
              },
            ];
          });
          setSending(false);
        }

        // 2. If background order is published via SSE
        if (data.order_id) {
          const orderNotice = `📦 **Order Created: #${data.order_id}**\n\nPenny has compiled and created your order specification. You can review items, approve payment, or settle autonomously.`;
          setChatMessages((prev) => {
            if (prev.some((m) => m.content.includes(data.order_id!)))
              return prev;
            return [
              ...prev,
              {
                id: `order-sse-${Date.now()}`,
                role: "penny",
                content: orderNotice,
              },
            ];
          });
          onNotify(`Live stream: Order ${data.order_id} generated!`, "info");
        }
      },
      () => {
        // SSE disconnected / reconnecting
      },
    );

    return () => {
      unsubscribe();
    };
  }, [onNotify]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] || null;
    if (!selected) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      onNotify("Please select an image file (JPEG, PNG, or WEBP).", "error");
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    onNotify(`Attached "${selected.name}" for visual search.`, "info");
  }

  function handleRemoveFile() {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() && !file) return;

    if (!token) {
      onNotify("Please sign in or register to chat with Penny.", "error");
      return;
    }

    const userQuery =
      text.trim() || (file ? "Find products matching this photo" : "");
    const currentFile = file;
    const currentPreview = previewUrl;

    // Append user message immediately
    const userMsgId = `user-${Date.now()}`;
    setChatMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        content: userQuery,
        imageUrl: currentPreview || undefined,
        fileName: currentFile?.name,
      },
    ]);

    setText("");
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSending(true);

    try {
      const response = await api.chat(userQuery, token, currentFile);
      const pennyText =
        typeof response === "string"
          ? response
          : response?.penny || "I’ve updated your recommendation.";

      setChatMessages((prev) => {
        const last = prev[prev.length - 1];
        if (
          last &&
          last.role === "penny" &&
          last.content.trim() === pennyText.trim()
        ) {
          return prev;
        }
        return [
          ...prev,
          {
            id: `penny-${Date.now()}`,
            role: "penny",
            content: pennyText,
          },
        ];
      });

      // Check if response contains a PayPal payment link
      const paypalMatch = pennyText.match(
        /https?:\/\/[^\s)]*sandbox\.paypal\.com[^\s)]*/i,
      );
      if (paypalMatch) {
        const pending = parsePendingOrderFromReply(
          pennyText,
          paypalMatch[0],
          guardrails.mode,
        );
        sessionStorage.setItem("penny_pending_order", JSON.stringify(pending));
        onNotify(
          `PayPal order prepared ($${pending.totalPrice.toFixed(2)})! You can now proceed to checkout.`,
          "info",
        );
      }
    } catch (reason) {
      onNotify(
        reason instanceof Error
          ? reason.message
          : "Penny couldn’t send your message.",
        "error",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="chat-layout page-enter">
      <aside className="context-rail">
        <div className="context-top">
          <p className="overline">NEW PURCHASE</p>
          <h2>Let’s find the right fit, not just a product.</h2>
          <p>
            Shop the way you’d talk to someone who knows you. Start with what
            you need or an image, then shape the answer together.
          </p>
        </div>

        <div className="agent-rules">
          <p className="overline">YOUR DEFAULT CONTROLS</p>
          <div>
            <Icon name="shield" size={16} />
            <span>
              <strong>
                {guardrails.mode === "shop-with-me"
                  ? "Shop with me"
                  : "Buy for me"}
              </strong>
              <small>
                {guardrails.mode === "shop-with-me"
                  ? "You complete PayPal checkout"
                  : "Penny completes checkout with saved vault"}
              </small>
            </span>
          </div>
        </div>

        <button className="edit-guardrails" onClick={onCustomize}>
          <Icon name="settings" size={14} /> Change Penny mode
        </button>

        <button
          className="edit-guardrails"
          onClick={onOpenDemo}
          style={{ marginTop: 8 }}
        >
          <Icon name="sparkles" size={14} /> How Penny Works Demo
        </button>

        <div className="autonomy-preview">
          <h3>Autonomous payments</h3>
          <p>
            With Buy for me mode, Penny uses your saved PayPal token to capture
            orders automatically.
          </p>
          <button onClick={() => goTo("autonomy")}>
            Configure PayPal Vault <Icon name="arrow" size={14} />
          </button>
        </div>
      </aside>

      <section className="conversation">
        <div className="conversation-head">
          <div>
            <span className="agent-avatar">
              <img src={pennyLogo} alt="Penny" className="penny-avatar-img" />
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              className={sending ? "live-dot live-dot-researching" : "live-dot"}
            >
              {sending ? "Penny Researching..." : "Online"}
            </span>
            {chatMessages.length > 1 && (
              <button
                className="clear-chat-btn"
                disabled={clearing}
                onClick={handleClearHistory}
                title="Clear conversation history"
                type="button"
              >
                <Icon name="trash" size={12} />
                <span>{clearing ? "Clearing..." : "Clear history"}</span>
              </button>
            )}
          </div>
        </div>

        <div className="messages">
          <div className="date-divider">
            <span>Today</span>
          </div>

          {loadingHistory && (
            <div
              className="chat-skeleton-container"
              aria-label="Loading messages..."
            >
              <div className="chat-skeleton-badge">
                <span
                  className="button-spinner"
                  style={{ width: 12, height: 12, borderWidth: 1.5 }}
                />
                <span>Syncing conversation history...</span>
              </div>
              <div className="chat-skeleton-row">
                <div className="skeleton-avatar" />
                <div
                  className="skeleton-bubble skeleton-bubble-agent"
                  style={{ width: "70%", height: 54 }}
                />
              </div>
              <div className="chat-skeleton-row chat-skeleton-user">
                <div
                  className="skeleton-bubble skeleton-bubble-user"
                  style={{ width: "48%", height: 38 }}
                />
              </div>
              <div className="chat-skeleton-row">
                <div className="skeleton-avatar" />
                <div
                  className="skeleton-bubble skeleton-bubble-agent"
                  style={{ width: "82%", height: 68 }}
                />
              </div>
            </div>
          )}

          {chatMessages.length <= 1 && (
            <div className="chat-visual-discovery">
              <span className="chat-discovery-label">
                POPULAR VISUAL SEARCHES
              </span>
              <div className="chat-visual-tiles">
                {visualSuggestions.map((item) => (
                  <button
                    className="chat-visual-tile"
                    key={item.title}
                    onClick={() => setText(item.query)}
                    type="button"
                  >
                    <img alt={item.title} src={item.image} />
                    <div className="chat-tile-text">
                      <span className="chat-tile-badge">{item.badge}</span>
                      <strong>{item.title}</strong>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="suggestion-row">
            {suggestions.map((suggestion) => (
              <button key={suggestion} onClick={() => setText(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>

          {chatMessages.map((msg) => {
            const isUser = msg.role === "user";
            const contentLower = msg.content.toLowerCase();

            const parsedReceipt = !isUser ? parseReceiptFromText(msg.content) : null;
            const isReceiptSettled = parsedReceipt?.kind === "receipt";

            // Detect if this message confirms order settlement, capture, or completed payment
            const isOrderSettled =
              !isUser &&
              (isReceiptSettled ||
                contentLower.includes("captured") ||
                contentLower.includes("payment complete") ||
                contentLower.includes("payment received") ||
                contentLower.includes("order settled") ||
                contentLower.includes("order confirmed") ||
                contentLower.includes("order placed") ||
                contentLower.includes("successfully paid") ||
                contentLower.includes("purchase complete") ||
                contentLower.includes("payment success") ||
                contentLower.includes("transaction id"));

            // Only show checkout button if it's genuinely a pending checkout, has an explicit checkout URL, and is NOT a settled receipt
            const hasCheckoutUrl =
              msg.content.includes("sandbox.paypal.com") ||
              contentLower.includes("paypal.com/checkoutnow") ||
              contentLower.includes("paypal.com/checkout");

            const hasCheckoutPrompt =
              !isUser && !isOrderSettled && (hasCheckoutUrl || parsedReceipt?.kind === "invoice");

            const hasProducts =
              !isUser &&
              !parsedReceipt &&
              /^(?:(\d+)\.|\-|\*)\s+\*\*([^*]+)\*\*/m.test(msg.content);

            return (
              <div
                className={
                  isUser
                    ? "message user-message"
                    : `agent-message-row${hasProducts ? " has-products-row" : ""}`
                }
                key={msg.id}
              >
                {!isUser && (
                  <span className="mini-avatar">
                    <img
                      src={pennyLogo}
                      alt="Penny"
                      className="penny-avatar-img"
                    />
                  </span>
                )}

                <div
                  className={
                    isUser
                      ? ""
                      : `message agent-message${hasProducts ? " has-products-card" : ""}`
                  }
                >
                  {msg.imageUrl && (
                    <div
                      style={{
                        marginBottom: 8,
                        borderRadius: 6,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.3)",
                        maxWidth: 240,
                      }}
                    >
                      <img
                        alt="Uploaded for search"
                        src={msg.imageUrl}
                        style={{
                          display: "block",
                          width: "100%",
                          height: "auto",
                        }}
                      />
                      {msg.fileName && (
                        <div
                          style={{
                            padding: "3px 6px",
                            fontSize: 9,
                            background: "rgba(0,0,0,0.5)",
                            color: "#fff",
                          }}
                        >
                          {msg.fileName}
                        </div>
                      )}
                    </div>
                  )}

                  {isUser ? (
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                      {msg.content}
                    </p>
                  ) : (
                    formatPennyMessage(msg.content)
                  )}

                  {hasCheckoutPrompt && (
                    <div
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #dcdfd8",
                        paddingTop: 10,
                      }}
                    >
                      <button
                        className="primary-action"
                        onClick={() => goTo("payment")}
                        style={{
                          padding: "8px 14px",
                          width: "auto",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div className="bg-white p-1 rounded-full">
                          <img
                            alt="PayPal"
                            src={paypalLogo}
                            style={{
                              height: 16,
                              width: "auto",
                              objectFit: "contain",
                            }}
                          />
                        </div>
                        Proceed to Checkout <Icon name="arrow" size={14} />
                      </button>
                    </div>
                  )}

                  {isOrderSettled && !parsedReceipt && (
                    <div
                      style={{
                        marginTop: 12,
                        borderTop: "1px solid #dcdfd8",
                        paddingTop: 10,
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        className="primary-action"
                        onClick={() => {
                          if (onOpenOrders) {
                            onOpenOrders();
                          } else {
                            goTo("success");
                          }
                        }}
                        style={{
                          padding: "8px 14px",
                          width: "auto",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Icon name="check" size={14} />
                        View Order &amp; Receipt
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {sending && (
            <div aria-live="polite" className="agent-message-row">
              <span className="mini-avatar">
                <Icon name="sparkles" size={13} />
              </span>
              <div className="message agent-message thinking-card">
                <div className="thinking-header">
                  <div className="thinking-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <strong>Penny is researching verified merchants...</strong>
                </div>
                <p className="thinking-subtext">
                  Comparing prices, real-time inventory, and PayPal checkout
                  routes.
                </p>
                <div className="thinking-shimmer-bar" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="composer-wrapper">
          <form className="composer" onSubmit={sendMessage}>
            {file && (
              <div className="file-chip">
                <Icon name="sparkles" size={12} />
                <span>{file.name}</span>
                <button
                  aria-label="Remove attachment"
                  onClick={handleRemoveFile}
                  type="button"
                >
                  <Icon name="x" size={12} />
                </button>
              </div>
            )}

            <input
              aria-label="Message your commerce agent"
              onChange={(event) => setText(event.target.value)}
              placeholder={
                file
                  ? "Add specifics (budget, color, sizing) or press Enter to search photo..."
                  : "Ask Penny to search, compare, or attach a photo..."
              }
              value={text}
            />

            <label
              className="file-button"
              title="Attach a product photo or screenshot (JPEG, PNG, WEBP)"
            >
              <input
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
              />
              <Icon name="plus" size={16} />
            </label>

            <button
              aria-label="Send message"
              className="send-button"
              disabled={sending || (!text.trim() && !file)}
              type="submit"
            >
              {sending ? (
                <span className="button-spinner" />
              ) : (
                <Icon name="send" size={17} />
              )}
            </button>
            <p>
              <Icon name="shield" size={12} />{" "}
              {guardrails.mode === "shop-with-me"
                ? "Shop with me: you complete checkout"
                : "Buy for me: Penny completes checkout"}
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

function ReviewView({ goTo }: { goTo: (view: View) => void }) {
  const pendingOrder = (() => {
    try {
      const saved = sessionStorage.getItem("penny_pending_order");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const itemTitle =
    pendingOrder?.items?.[0]?.description ||
    "Smart Noise-Cancelling Headphones (Penny Recommendation)";
  const displayTotal =
    pendingOrder?.totalPrice !== undefined && pendingOrder.totalPrice > 0
      ? `$${pendingOrder.totalPrice.toFixed(2)} USD`
      : "$129.00 USD";
  const displaySubtotal =
    pendingOrder?.totalPrice !== undefined && pendingOrder.totalPrice > 0
      ? `$${pendingOrder.totalPrice.toFixed(2)}`
      : "$129.00";
  return (
    <main className="review-page page-enter">
      <button className="back-button" onClick={() => goTo("chat")}>
        <Icon name="back" size={14} /> Back to Penny conversation
      </button>

      <div className="review-heading">
        <div>
          <p className="overline">AGENT RECOMMENDATION</p>
          <h1>Curated Decision Set</h1>
          <p>
            Penny analyzed specs, real-time pricing, and user reviews to select
            this option.
          </p>
        </div>
        <div className="confidence">
          <span>96%</span>
          <div>
            <strong>High confidence match</strong>
            <small>
              Matches budget, active noise cancellation, and rating threshold
            </small>
          </div>
        </div>
      </div>

      <div className="review-grid">
        <section className="recommendations">
          <article className="decision-card">
            <div className="product-visual">
              <span className="best-match">BEST MATCH</span>
              <div
                style={{
                  height: "100%",
                  minHeight: 220,
                  display: "grid",
                  placeItems: "center",
                  color: "#6c8879",
                }}
              >
                <Icon name="bag" size={48} />
              </div>
            </div>
            <div className="decision-info">
              <span className="brand-name">PENNY VERIFIED</span>
              <h2>{itemTitle}</h2>
              <p className="product-meta">
                Model NC-800 &bull; 40hr Battery &bull; Multipoint Bluetooth
              </p>
              <div className="rating">
                ★ 4.8 <span>(1,420 verified buyer reviews)</span>
              </div>
              <div className="reason-box">
                <strong>Why Penny selected this:</strong>
                <p>
                  Offers top-tier active noise cancellation in the sub-$150
                  price tier. Lightweight headband, fast USB-C charging, and
                  compatible with all major devices.
                </p>
              </div>
              <div className="merchant-line">
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <img
                    alt="PayPal"
                    src={paypalLogo}
                    style={{ height: 14, width: "auto", objectFit: "contain" }}
                  />
                  Verified PayPal Sandbox Merchant
                </span>
                <strong>{displayTotal}</strong>
              </div>
            </div>
          </article>
        </section>

        <aside className="decision-summary">
          <h2>Purchase Summary</h2>
          <div className="summary-lines">
            <div>
              <span>Subtotal</span>
              <strong>{displaySubtotal}</strong>
            </div>
            <div>
              <span>Estimated Shipping</span>
              <span className="positive">FREE</span>
            </div>
            <div>
              <span>Estimated Tax</span>
              <span>$0.00</span>
            </div>
            <div className="summary-total">
              <strong>Total</strong>
              <strong>{displayTotal}</strong>
            </div>
          </div>

          <div className="decision-details">
            <div>
              <Icon name="shield" size={15} />
              <span>
                <strong>Buyer Protected</strong>
                <small>Full PayPal Purchase Protection included</small>
              </span>
            </div>
            <div>
              <Icon name="clock" size={15} />
              <span>
                <strong>Fast Dispatch</strong>
                <small>Ships within 24 hours of settlement</small>
              </span>
            </div>
          </div>

          <button className="primary-action" onClick={() => goTo("payment")}>
            Approve &amp; Continue to Checkout <Icon name="arrow" size={14} />
          </button>
        </aside>
      </div>
    </main>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const view = viewFromPath(location.pathname);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [demoPresetQuery, setDemoPresetQuery] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved =
        localStorage.getItem("penny_user") ||
        sessionStorage.getItem("penny_user");
      if (!saved) return null;
      return JSON.parse(saved) as AuthUser;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    try {
      return (
        localStorage.getItem("penny_access_token") ||
        sessionStorage.getItem("penny_access_token") ||
        ""
      );
    } catch {
      return "";
    }
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [hasVaultToken, setHasVaultToken] = useState(false);
  const [guardrails, setGuardrails] = useState<Guardrails>(() => ({
    mode:
      (localStorage.getItem("penny_mode") ||
        sessionStorage.getItem("penny_mode")) === "buy-for-me"
        ? "buy-for-me"
        : "shop-with-me",
  }));

  // Cross-tab auth state synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "penny_access_token" || e.key === "penny_user") {
        try {
          const freshToken =
            localStorage.getItem("penny_access_token") ||
            sessionStorage.getItem("penny_access_token") ||
            "";
          const freshUserRaw =
            localStorage.getItem("penny_user") ||
            sessionStorage.getItem("penny_user");
          setToken(freshToken);
          setUser(freshUserRaw ? (JSON.parse(freshUserRaw) as AuthUser) : null);
        } catch {
          // Ignore parse errors
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const pageTitle = useMemo(() => {
    if (view === "landing") return "Penny — Agentic commerce";
    if (view === "success") return "Payment approved — Penny";
    if (view === "cancel") return "Payment cancelled — Penny";
    if (view === "payment") return "Checkout & Payment — Penny";
    if (view === "autonomy") return "Autonomous Commerce — Penny";
    if (view === "review") return "Decision Review — Penny";
    return "Penny commerce agent";
  }, [view]);

  useEffect(() => {
    document.title = pageTitle;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pageTitle]);

  // Check backend vault token on auth state change to enforce strict permissions
  useEffect(() => {
    if (!token) {
      setHasVaultToken(false);
      setGuardrails({ mode: "shop-with-me" });
      localStorage.setItem("penny_mode", "shop-with-me");
      sessionStorage.setItem("penny_mode", "shop-with-me");
      return;
    }

    let active = true;
    api
      .getVault(token)
      .then((vault) => {
        if (!active) return;
        if (vault) {
          setHasVaultToken(true);
          const savedMode =
            localStorage.getItem("penny_mode") ||
            sessionStorage.getItem("penny_mode");
          const mode =
            savedMode === "buy-for-me" ? "buy-for-me" : "shop-with-me";
          setGuardrails({ mode });
        } else {
          setHasVaultToken(false);
          // Without a vault token, strictly enforce Shop with me mode
          setGuardrails({ mode: "shop-with-me" });
          localStorage.setItem("penny_mode", "shop-with-me");
          sessionStorage.setItem("penny_mode", "shop-with-me");
        }
      })
      .catch(() => {
        if (active) {
          setHasVaultToken(false);
          setGuardrails({ mode: "shop-with-me" });
          localStorage.setItem("penny_mode", "shop-with-me");
          sessionStorage.setItem("penny_mode", "shop-with-me");
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  // Handle return redirect from PayPal Vault authorization (e.g. ?approved=true)
  useEffect(() => {
    if (!token) return;

    const params = new URLSearchParams(window.location.search);
    const isApproved =
      params.get("approved") === "true" ||
      params.get("approval_token_id") !== null;

    const setupTokenId =
      params.get("approval_token_id") ||
      params.get("token") ||
      localStorage.getItem("penny_vault_setup_token_id") ||
      sessionStorage.getItem("penny_vault_setup_token_id");

    if (isApproved && setupTokenId) {
      api
        .exchangeVaultSetupToken(setupTokenId, token)
        .then(() => {
          setHasVaultToken(true);
          setGuardrails({ mode: "buy-for-me" });
          localStorage.setItem("penny_mode", "buy-for-me");
          sessionStorage.setItem("penny_mode", "buy-for-me");
          localStorage.removeItem("penny_vault_setup_token_id");
          sessionStorage.removeItem("penny_vault_setup_token_id");
          notify(
            "PayPal Vault authorized! Switched to 'Buy for me' mode.",
            "success",
          );
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        })
        .catch((err) => {
          console.warn("Could not exchange vault setup token on return:", err);
          notify("Failed to complete PayPal Vault authorization.", "error");
        });
    }
  }, [token]);

  // Subscribe to real-time agent SSE stream for live order & vault telemetry
  useEffect(() => {
    if (!token) return;
    const unsubscribe = api.subscribeSSE(async (data) => {
      if (data.order_id) {
        notify(`Order update: ${data.order_id}`, "info");
      }

      // Vault setup approval token event from SSE
      const incomingSetupToken =
        data.setup_token ||
        data.vault_setup_token_id ||
        data.approval_token_id ||
        (data.event === "vault_approved" &&
          (data.token || sessionStorage.getItem("penny_vault_setup_token_id")));

      if (incomingSetupToken) {
        try {
          await api.exchangeVaultSetupToken(incomingSetupToken, token);
          setHasVaultToken(true);
          setGuardrails({ mode: "buy-for-me" });
          sessionStorage.setItem("penny_mode", "buy-for-me");
          sessionStorage.removeItem("penny_vault_setup_token_id");
          notify(
            "PayPal Vault approved via live stream! 'Buy for me' mode activated.",
            "success",
          );
        } catch (err) {
          console.warn("Could not exchange vault setup token from SSE:", err);
        }
      }
    });
    return () => {
      unsubscribe();
    };
  }, [token]);

  function goTo(next: View) {
    const paths: Record<View, string> = {
      landing: "/",
      chat: "/chat",
      review: "/review",
      payment: "/checkout",
      success: "/order/success",
      cancel: "/checkout/cancel",
      autonomy: "/autonomy",
    };
    navigate(paths[next]);
  }

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  function enterAgent(query?: string) {
    if (query) {
      setDemoPresetQuery(query);
    }
    if (user) goTo("chat");
    else openAuth("signup");
  }

  function handleSignOut() {
    try {
      localStorage.removeItem("penny_access_token");
      localStorage.removeItem("penny_user");
      localStorage.removeItem("penny_vault_setup_token_id");
      sessionStorage.removeItem("penny_access_token");
      sessionStorage.removeItem("penny_user");
      sessionStorage.removeItem("penny_vault_setup_token_id");
    } catch (e) {
      console.warn("Storage clear error:", e);
    }
    setToken("");
    setUser(null);
    notify("You have signed out.", "info");
    goTo("landing");
  }

  async function handleModeChange(nextMode: "shop-with-me" | "buy-for-me") {
    if (nextMode === "buy-for-me") {
      // If user already has a valid vault token, simply switch mode
      if (hasVaultToken) {
        setGuardrails({ mode: "buy-for-me" });
        localStorage.setItem("penny_mode", "buy-for-me");
        sessionStorage.setItem("penny_mode", "buy-for-me");
        notify("Buy for me mode active with verified PayPal vault.", "success");
        return;
      }

      // No vault token: require authentication first
      if (!token) {
        notify(
          "Please sign in first to authorize PayPal Vault payments.",
          "error",
        );
        openAuth("signin");
        return;
      }

      // Trigger PayPal setup token endpoint and redirect
      try {
        notify("Initiating PayPal Vault authorization...", "info");
        const res = await api.createVaultSetupToken(token);
        const link = res.paypal_response?.payer_vault_setup_approval_link;
        const setupId = res.paypal_response?.vault_setup_token_id;

        if (!link || !setupId) {
          throw new Error(
            "Could not retrieve PayPal Vault setup approval link",
          );
        }

        localStorage.setItem("penny_vault_setup_token_id", setupId);
        sessionStorage.setItem("penny_vault_setup_token_id", setupId);

        // Redirect to PayPal approval page
        window.location.href = link;
      } catch (err: unknown) {
        notify(
          err instanceof Error
            ? err.message
            : "Failed to initiate PayPal Vault authorization.",
          "error",
        );
      }
    } else {
      // User switches back to "Shop for me" mode -> delete the sensitive vault token from the backend
      setGuardrails({ mode: "shop-with-me" });
      localStorage.setItem("penny_mode", "shop-with-me");
      sessionStorage.setItem("penny_mode", "shop-with-me");
      localStorage.removeItem("penny_vault_setup_token_id");
      sessionStorage.removeItem("penny_vault_setup_token_id");

      if (token && hasVaultToken) {
        try {
          await api.deleteVault(token);
          setHasVaultToken(false);
          notify(
            "PayPal vault token deleted securely. Switched back to Shop for me mode.",
            "success",
          );
        } catch (err) {
          console.warn("Could not delete vault token:", err);
          notify("Switched back to Shop for me mode.", "info");
        }
      } else {
        setHasVaultToken(false);
        notify("Shop with me mode active.", "info");
      }
    }
  }

  function notify(message: string, tone: ToastItem["tone"] = "success") {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3500);
  }

  async function authenticate(mode: AuthMode, payload: AuthPayload) {
    if (mode === "signup") {
      await api.register({
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        password: payload.password,
        gender: payload.gender || "female",
      });
    }

    const response = await api.login(payload.email, payload.password);
    const nextUser: AuthUser = {
      id: response.user.id,
      firstName: response.user.first_name,
      lastName: response.user.last_name,
      email: response.user.email,
      gender: response.user.gender,
      role: response.user.role,
    };
    try {
      localStorage.setItem("penny_access_token", response.access_token);
      localStorage.setItem("penny_user", JSON.stringify(nextUser));
      sessionStorage.setItem("penny_access_token", response.access_token);
      sessionStorage.setItem("penny_user", JSON.stringify(nextUser));
    } catch (e) {
      console.warn("Storage write error:", e);
    }
    setToken(response.access_token);
    setUser(nextUser);
    setAuthOpen(false);
    setToken(response.access_token);
    setUser(nextUser);
    setAuthOpen(false);
    notify(
      mode === "signup"
        ? `Welcome to Penny, ${nextUser.firstName}.`
        : `Welcome back, ${nextUser.firstName}.`,
    );
    goTo("chat");
  }

  return (
    <div className="app">
      {view !== "success" && view !== "cancel" && (
        <Header
          goTo={goTo}
          onCustomize={() => setPreferencesOpen(true)}
          onOpenDemo={() => setDemoOpen(true)}
          onOpenOrders={() => setOrdersOpen(true)}
          onSignIn={() => openAuth("signin")}
          onSignUp={() => openAuth("signup")}
          onSignOut={handleSignOut}
          user={user}
          view={view}
        />
      )}

      {view === "landing" && (
        <LandingPage
          mode={guardrails.mode}
          onEnter={enterAgent}
          onModeChange={handleModeChange}
          onOpenDemo={() => setDemoOpen(true)}
          onSignIn={() => openAuth("signin")}
          onSignUp={() => openAuth("signup")}
          user={user}
        />
      )}

      {view === "chat" && (
        <ChatView
          goTo={goTo}
          guardrails={guardrails}
          onCustomize={() => setPreferencesOpen(true)}
          onNotify={notify}
          onOpenDemo={() => setDemoOpen(true)}
          onOpenOrders={() => setOrdersOpen(true)}
          presetQuery={demoPresetQuery}
          token={token}
          user={user}
        />
      )}

      {view === "review" && <ReviewView goTo={goTo} />}

      {view === "payment" && (
        <PaymentPage onNavigate={goTo} onNotify={notify} token={token} />
      )}

      {view === "success" && (
        <SuccessPage
          onNavigate={goTo}
          onOpenOrders={() => setOrdersOpen(true)}
          token={token}
        />
      )}

      {view === "cancel" && <CancelPage onNavigate={goTo} />}

      {view === "autonomy" && (
        <AutonomyPage onNavigate={goTo} onNotify={notify} token={token} />
      )}

      <DemoModal
        onClose={() => setDemoOpen(false)}
        onTryQuery={(q) => {
          setDemoPresetQuery(q);
          goTo("chat");
        }}
        open={demoOpen}
      />

      <OrdersModal
        isOpen={ordersOpen}
        onClose={() => setOrdersOpen(false)}
        onNotify={notify}
        token={token}
      />

      <GuardrailModal
        hasVaultToken={hasVaultToken}
        onClose={() => setPreferencesOpen(false)}
        onSave={(settings) => {
          setPreferencesOpen(false);
          handleModeChange(settings.mode);
        }}
        open={preferencesOpen}
        settings={guardrails}
      />

      <AuthModal
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
        onSubmit={authenticate}
        open={authOpen}
      />

      <div aria-atomic="true" aria-live="polite" className="toast-region">
        {toasts.map((toast) => (
          <div className={`toast toast-${toast.tone}`} key={toast.id}>
            <span>
              <Icon
                name={
                  toast.tone === "success"
                    ? "check"
                    : toast.tone === "error"
                      ? "x"
                      : "sparkles"
                }
                size={15}
              />
            </span>
            <p>{toast.message}</p>
            <button
              aria-label="Dismiss notification"
              onClick={() =>
                setToasts((current) =>
                  current.filter((item) => item.id !== toast.id),
                )
              }
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
