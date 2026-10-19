import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessagesContext } from "./MessagesContext";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { friendlyMessageError } from "../lib/messageErrors";
import { toConversation, toMessage, validateMessage } from "../lib/messages";

const CONVERSATION_COLUMNS = "id, pet_id, shelter_id, last_message_at";
const MESSAGE_COLUMNS = "id, conversation_id, sender, body, created_at";

export default function MessagesProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const knownConversations = useRef(new Set());

  // Loads everything and returns it, or null when loading failed.
  const reload = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setMessages([]);
      setLoading(false);
      return null;
    }

    const [conversationResult, messageResult] = await Promise.all([
      supabase
        .from("conversations")
        .select(CONVERSATION_COLUMNS)
        .eq("user_id", userId)
        .order("last_message_at", { ascending: false }),
      supabase
        .from("messages")
        .select(MESSAGE_COLUMNS)
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(500),
    ]);

    if (conversationResult.error || messageResult.error) {
      setError("We could not load your messages.");
      setLoading(false);
      return null;
    }

    const loadedConversations = conversationResult.data.map(toConversation);
    const loadedMessages = messageResult.data.map(toMessage);
    setConversations(loadedConversations);
    setMessages(loadedMessages);
    setError(null);
    setLoading(false);
    return { conversations: loadedConversations, messages: loadedMessages };
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    knownConversations.current = new Set(conversations.map((c) => c.id));
  }, [conversations]);

  // Adds a message once, and keeps the conversation's last activity current.
  const addMessage = useCallback((message) => {
    setMessages((prev) =>
      prev.some((m) => m.id === message.id) ? prev : [...prev, message],
    );
    setConversations((prev) =>
      prev.map((c) =>
        c.id === message.conversationId && message.createdAt > c.lastMessageAt
          ? { ...c, lastMessageAt: message.createdAt }
          : c,
      ),
    );
  }, []);

  // New messages arrive live (also from another tab).
  useEffect(() => {
    if (!userId) return undefined;

    const channel = supabase
      .channel(`messages:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const message = toMessage(payload.new);
          addMessage(message);
          if (!knownConversations.current.has(message.conversationId)) {
            reload();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, addMessage, reload]);

  // Sends a message about a pet, starting the conversation on the first one.
  const send = useCallback(
    async (petId, rawBody) => {
      const problem = validateMessage(rawBody);
      if (problem) return { error: problem };
      const body = rawBody.trim();

      let conversation = conversations.find((c) => c.petId === petId);

      if (!conversation) {
        const { data, error: createError } = await supabase
          .from("conversations")
          .insert({ user_id: userId, pet_id: petId })
          .select(CONVERSATION_COLUMNS)
          .single();

        if (!createError) {
          const created = toConversation(data);
          conversation = created;
          setConversations((prev) =>
            prev.some((c) => c.id === created.id) ? prev : [created, ...prev],
          );
        } else if (createError.code === "23505") {
          // Another tab created it a moment ago: load it and carry on.
          const fresh = await reload();
          conversation = fresh?.conversations.find((c) => c.petId === petId);
        }

        if (!conversation) {
          return { error: friendlyMessageError(createError) };
        }
      }

      const { data: sent, error: sendError } = await supabase
        .from("messages")
        .insert({ conversation_id: conversation.id, sender: "user", body })
        .select(MESSAGE_COLUMNS)
        .single();

      if (sendError) return { error: friendlyMessageError(sendError) };

      addMessage(toMessage(sent));
      return { conversationId: conversation.id };
    },
    [conversations, userId, reload, addMessage],
  );

  // Demo tool: the shelter answers.
  const demoShelterReply = useCallback(
    async (conversationId) => {
      const { data, error: replyError } = await supabase.rpc(
        "demo_shelter_reply",
        { p_conversation_id: conversationId },
      );
      if (replyError) return { error: friendlyMessageError(replyError) };

      addMessage(toMessage(Array.isArray(data) ? data[0] : data));
      return {};
    },
    [addMessage],
  );

  const value = useMemo(
    () => ({
      conversations,
      messages,
      loading,
      error,
      send,
      demoShelterReply,
      reload,
    }),
    [conversations, messages, loading, error, send, demoShelterReply, reload],
  );

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
}