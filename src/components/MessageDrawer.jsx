import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMessages } from "../hooks/useMessages";
import {
  MAX_MESSAGE_LENGTH,
  conversationForPet,
  threadFor,
} from "../lib/messages";

export default function MessageDrawer({ pet, onClose }) {
  const { conversations, messages, send } = useMessages();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState("");
  const inputRef = useRef(null);
  const threadRef = useRef(null);

  const conversation = conversationForPet(conversations, pet.id);
  const thread = conversation ? threadFor(messages, conversation.id) : [];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const element = threadRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [thread.length]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (sending) return;
    setProblem("");
    setSending(true);
    const result = await send(pet.id, draft);
    setSending(false);
    if (result.error) {
      setProblem(result.error);
    } else {
      setDraft("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        data-testid="message-drawer-backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Message ${pet.shelter.name}`}
        className="relative flex h-full w-[420px] max-w-full flex-col gap-4 bg-[#FFF6EA] p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <h2 className="m-0 text-xl font-extrabold">{pet.shelter.name}</h2>
            <span className="text-sm text-[#5B5348]">About {pet.name}</span>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="min-h-11 min-w-11 cursor-pointer rounded-xl border-2 border-[#1A1A1A] bg-white text-lg font-semibold"
          >
            ✕
          </button>
        </div>

        <div
          ref={threadRef}
          role="log"
          aria-label="Messages in this conversation"
          className="flex flex-1 flex-col gap-2.5 overflow-y-auto"
        >
          {thread.length === 0 && (
            <p className="m-0 text-[15px] text-[#5B5348]">
              Ask {pet.shelter.name} anything about {pet.name}.
            </p>
          )}
          {thread.map((message) => (
            <div
              key={message.id}
              className={`max-w-[80%] whitespace-pre-wrap rounded-[20px] px-4 py-3 text-[15px] leading-[1.45] ${
                message.fromMe ? "self-end bg-brand" : "self-start bg-white"
              }`}
            >
              {message.body}
            </div>
          ))}
        </div>

        {problem && (
          <p role="alert" className="m-0 rounded-2xl bg-[#FDE8E8] px-5 py-3 font-semibold">
            {problem}
          </p>
        )}

        {conversation && (
          <Link
            to={`/messages?conversation=${conversation.id}`}
            className="text-sm font-semibold underline"
          >
            Open in Messages
          </Link>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2.5">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Write a message"
            aria-label="Message"
            className="box-border h-14 min-w-0 flex-1 rounded-[14px] border-2 border-white bg-white px-[18px] text-base"
          />
          <button
            type="submit"
            disabled={sending || draft.trim() === ""}
            className="min-h-14 cursor-pointer rounded-[14px] border-0 bg-brand px-7 font-extrabold text-[#2B1A0C] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </aside>
    </div>
  );
}