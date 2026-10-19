import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageCard from "../components/PageCard";
import { useMessages } from "../hooks/useMessages";
import { usePets } from "../hooks/usePets";
import { demoToolsEnabled } from "../lib/demo";
import {
  MAX_MESSAGE_LENGTH,
  conversationTitle,
  inboxEntries,
  previewText,
  threadFor,
} from "../lib/messages";

export default function Messages() {
  const { conversations, messages, loading, error, send, demoShelterReply } =
    useMessages();
  const { pets = [] } = usePets();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [replying, setReplying] = useState(false);
  const [problem, setProblem] = useState("");
  const threadRef = useRef(null);

  const entries = inboxEntries(conversations, messages);
  const requestedId = searchParams.get("conversation");
  const selected =
    entries.find((entry) => entry.conversation.id === requestedId) ??
    entries[0] ??
    null;
  const selectedId = selected?.conversation.id ?? null;
  const thread = selected ? threadFor(messages, selectedId) : [];

  function petFor(conversation) {
    return pets.find((pet) => pet.id === conversation.petId);
  }

  // Keep the newest message in view.
  useEffect(() => {
    const element = threadRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [selectedId, thread.length]);

  function openConversation(id) {
    setSearchParams({ conversation: id }, { replace: true });
    setDraft("");
    setProblem("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selected || sending) return;
    setProblem("");
    setSending(true);
    const result = await send(selected.conversation.petId, draft);
    setSending(false);
    if (result.error) {
      setProblem(result.error);
    } else {
      setDraft("");
    }
  }

  async function handleDemoReply() {
    setProblem("");
    setReplying(true);
    const result = await demoShelterReply(selectedId);
    setReplying(false);
    if (result.error) setProblem(result.error);
  }

  return (
    <PageCard className="flex flex-col gap-6">
      <h1 className="m-0 text-[40px] font-extrabold tracking-[-1px]">Messages</h1>

      {loading && <p className="m-0 text-[#5B5348]">Loading your messages…</p>}

      {!loading && error && (
        <p role="alert" className="m-0 rounded-2xl bg-[#FDE8E8] px-5 py-3 font-semibold">
          {error}
        </p>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-[28px] bg-[#FFF6EA] px-7 py-12 text-center">
          <span className="text-[22px] font-extrabold">No conversations yet</span>
          <span className="text-[15px] text-[#5B5348]">
            Open a pet's page to message its shelter.
          </span>
          <Link
            to="/explore"
            className="flex min-h-11 items-center rounded-2xl bg-brand px-6 font-extrabold text-[#1A1A1A]"
          >
            Browse pets
          </Link>
        </div>
      )}

      {!loading && !error && selected && (
        <div className="flex flex-wrap items-stretch gap-6">
          <nav
            aria-label="Conversations"
            className="flex w-[340px] max-w-full flex-col gap-2.5"
          >
            {entries.map(({ conversation, last }) => {
              const isSelected = conversation.id === selectedId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  aria-current={isSelected ? "true" : undefined}
                  onClick={() => openConversation(conversation.id)}
                  className={`flex min-h-[76px] cursor-pointer flex-col gap-1 rounded-[22px] border-2 px-[18px] py-3.5 text-left ${
                    isSelected
                      ? "border-brand bg-[#FFF6EA]"
                      : "border-[#EDEDED] bg-white"
                  }`}
                >
                  <span className="text-base font-extrabold">
                    {conversationTitle(petFor(conversation))}
                  </span>
                  <span className="text-sm text-[#5B5348]">
                    {previewText(last.body)}
                  </span>
                </button>
              );
            })}
          </nav>

          <section
            aria-label="Conversation"
            className="flex min-h-[560px] min-w-0 flex-[1_1_560px] flex-col gap-4 rounded-[32px] bg-[#FFF6EA] p-6"
          >
            <h2 className="m-0 text-xl font-extrabold">
              {conversationTitle(petFor(selected.conversation))}
            </h2>

            <div
              ref={threadRef}
              role="log"
              aria-label="Messages in this conversation"
              className="flex max-h-[480px] flex-1 flex-col gap-2.5 overflow-y-auto"
            >
              {thread.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[70%] whitespace-pre-wrap rounded-[20px] px-4 py-3 text-[15px] leading-[1.45] ${
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

            {demoToolsEnabled && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed border-[#E8C49A] px-4 py-3">
                <span className="text-sm font-semibold text-[#5B5348]">
                  Demo controls: play the shelter
                </span>
                <button
                  type="button"
                  disabled={replying}
                  onClick={handleDemoReply}
                  className="min-h-11 cursor-pointer rounded-xl border-2 border-[#1A1A1A] bg-white px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reply as shelter
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2.5">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder="Write a message"
                aria-label="Message"
                className="box-border h-14 flex-1 rounded-[14px] border-2 border-white bg-white px-[18px] text-base"
              />
              <button
                type="submit"
                disabled={sending || draft.trim() === ""}
                className="min-h-14 cursor-pointer rounded-[14px] border-0 bg-brand px-7 font-extrabold text-[#2B1A0C] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </section>
        </div>
      )}
    </PageCard>
  );
}