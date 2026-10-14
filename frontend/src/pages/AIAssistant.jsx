import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  FiArrowLeft,
  FiInfo,
  FiMenu,
  FiMessageCircle,
  FiSend,
} from "react-icons/fi";
import { supabase } from "../lib/supabase";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

const suggestedQuestions = [
  "Which of my warranties expire soon?",
  "Show me my registered products.",
  "How should I maintain my laptop?",
  "Which products need attention?",
];

function AIAssistant() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function checkUser() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          navigate("/login");
        }
      } catch (authError) {
        console.error("AI Assistant authentication error:", authError);
        if (!cancelled) {
          setError(authError.message || "Unable to verify your account.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkUser();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function sendQuestion(question) {
    const text = question.trim();
    if (!text || error || sendingRef.current) return;

    const history = messages
      .filter(
        (message) => message.role === "user" || message.role === "assistant",
      )
      .slice(-12)
      .map(({ role, text: messageText }) => ({
        role,
        text: messageText,
      }));

    sendingRef.current = true;
    setSending(true);
    setRequestError("");
    setMessages((currentMessages) => [
      ...currentMessages,
      { id: `${Date.now()}-question`, role: "user", text },
    ]);
    setInput("");

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "asset-assistant",
        { body: { message: text, history } },
      );

      if (functionError) {
        let safeMessage =
          functionError.context?.status === 429
            ? "The AI service is at its current usage limit. Please try later."
            : "The assistant could not complete your request. Please try again.";

        if (functionError.context) {
          try {
            const response = await functionError.context.clone().json();
            if (typeof response.error === "string") {
              safeMessage = response.error;
            }
          } catch {
            safeMessage =
              functionError.context.status === 401
                ? "Your session is invalid or expired. Sign in again."
                : safeMessage;
          }
        }

        throw new Error(safeMessage);
      }

      if (typeof data?.reply !== "string" || !data.reply.trim()) {
        throw new Error("The assistant returned an empty response. Please try again.");
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `${Date.now()}-answer`,
          role: "assistant",
          text: data.reply.trim(),
        },
      ]);
    } catch (requestFailure) {
      console.error(
        "AI Assistant request failed:",
        requestFailure instanceof Error ? requestFailure.name : "Unknown error",
      );
      setRequestError(
        requestFailure instanceof Error
          ? requestFailure.message
          : "The assistant could not complete your request. Please try again.",
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendQuestion(input);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-slate-500">
        Checking your account...
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden"
            aria-label="Open menu"
          >
            <FiMenu size={20} />
          </button>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"
          >
            <FiArrowLeft />
            Back to Dashboard
          </Link>
        </header>

        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col gap-7 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiMessageCircle size={20} />
              </span>
              <div>
                <p className="text-sm font-medium text-blue-600">
                  AssetCare-AI
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  AI Assistant
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Ask about your home assets, warranties, or product care.
                </p>
              </div>
            </div>
          </section>

          <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
              <FiInfo className="mt-0.5 shrink-0 text-slate-400" size={16} />
              <p className="text-xs leading-5 text-slate-500">
                Answers about your products use your saved asset details.
                General care suggestions are not a substitute for the product
                manual.
              </p>
            </div>

            {error ? (
              <p role="alert" className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {error}
              </p>
            ) : (
              <div
                aria-live="polite"
                className="flex min-h-72 flex-1 flex-col gap-4 overflow-y-auto rounded-xl bg-slate-50/70 p-4 sm:p-6"
              >
                {messages.length === 0 ? (
                  <div className="m-auto max-w-md py-8 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                      <FiMessageCircle size={22} />
                    </span>
                    <h2 className="mt-4 text-lg font-semibold">
                      What can I help you with?
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Ask about your registered assets or get general product
                      care guidance.
                    </p>
                  </div>
                ) : (
                  messages.map((message) =>
                    message.role === "user" ? (
                      <div
                        key={message.id}
                        className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-sm leading-6 text-white sm:max-w-[75%]"
                      >
                        {message.text}
                      </div>
                    ) : (
                      <div
                        key={message.id}
                        className="max-w-[90%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm sm:max-w-[80%]"
                      >
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <p className="mb-3 last:mb-0 whitespace-pre-line">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="pl-1">{children}</li>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-slate-900">
                                {children}
                              </strong>
                            ),
                            a: ({ children, href }) => (
                              <a
                                href={href}
                                className="text-blue-600 underline underline-offset-2"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {message.text}
                        </ReactMarkdown>
                      </div>
                    ),
                  )
                )}
                {sending && (
                  <p
                  role="status"
                  className="max-w-fit rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500"
                  >
                  Checking your assets and preparing a reply...
                  </p>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {requestError && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {requestError}
              </p>
            )}

            <div className="pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Suggested questions
              </p>
              <div className="mb-5 flex flex-wrap gap-2">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => sendQuestion(question)}
                    disabled={Boolean(error) || sending}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                  >
                    {question}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex items-end gap-3">
                <label className="sr-only" htmlFor="assistant-question">
                  Your question
                </label>
                <textarea
                  id="assistant-question"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      if (!sending) sendQuestion(input);
                    }
                  }}
                  placeholder="Ask about your assets or product care..."
                  rows={1}
                  disabled={Boolean(error) || sending}
                  className="max-h-32 min-h-12 flex-1 resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || Boolean(error) || sending}
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiSend size={16} />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
              <p className="mt-3 text-center text-xs text-slate-400">
                Enter to send · Shift + Enter for a new line
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default AIAssistant;
