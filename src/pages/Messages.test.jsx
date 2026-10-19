import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Messages from "./Messages";

const hook = vi.hoisted(() => ({
  state: { conversations: [], messages: [], loading: false, error: null },
  send: vi.fn(),
  demoShelterReply: vi.fn(),
}));

vi.mock("../hooks/useMessages", () => ({
  useMessages: () => ({
    ...hook.state,
    send: hook.send,
    demoShelterReply: hook.demoShelterReply,
  }),
}));

vi.mock("../hooks/usePets", () => ({
  usePets: () => ({
    pets: [
      { id: "p1", name: "Max", shelter: { name: "Heart Shelter" } },
      { id: "p2", name: "Rocky", shelter: { name: "PetLove Rescue" } },
    ],
  }),
}));

vi.mock("../lib/demo", () => ({ demoToolsEnabled: true }));

function conversation(id, petId) {
  return { id, petId, shelterId: "s1", lastMessageAt: new Date(2026, 9, 19, 9, 0) };
}

function message(id, conversationId, sender, minute, body) {
  return {
    id,
    conversationId,
    sender,
    fromMe: sender === "user",
    body,
    createdAt: new Date(2026, 9, 19, 10, minute),
  };
}

function Where() {
  return <p data-testid="where">{useLocation().search}</p>;
}

function renderPage(path = "/messages") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Messages />
      <Where />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  hook.state = {
    conversations: [
      conversation("c1", "p1"),
      conversation("c2", "p2"),
      conversation("c3", "p3"),
    ],
    messages: [
      message("m1", "c1", "user", 0, "Can I bring my sister?"),
      message("m2", "c1", "shelter", 5, "Of course. See you then."),
      message("m3", "c2", "shelter", 30, "We received your application for Rocky."),
    ],
    loading: false,
    error: null,
  };
  hook.send.mockReset();
  hook.send.mockResolvedValue({ conversationId: "c1" });
  hook.demoShelterReply.mockReset();
  hook.demoShelterReply.mockResolvedValue({});
});

describe("Messages page", () => {
  it("lists conversations with messages, newest first, with a preview", () => {
    renderPage();
    const nav = screen.getByRole("navigation", { name: "Conversations" });
    const buttons = within(nav).getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent).toContain("PetLove Rescue · Rocky");
    expect(buttons[0].textContent).toContain("We received your application for Rocky.");
    expect(buttons[1].textContent).toContain("Heart Shelter · Max");
    expect(buttons[1].textContent).toContain("Of course. See you then.");
  });

  it("opens the most recent conversation by default", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "PetLove Rescue · Rocky" }),
    ).not.toBeNull();
    const log = screen.getByRole("log");
    expect(within(log).getByText("We received your application for Rocky.")).not.toBeNull();
  });

  it("opens the conversation named in the link, with messages in order", () => {
    renderPage("/messages?conversation=c1");
    expect(screen.getByRole("heading", { name: "Heart Shelter · Max" })).not.toBeNull();
    const bubbles = within(screen.getByRole("log")).getAllByText(/./);
    expect(bubbles.map((b) => b.textContent)).toEqual([
      "Can I bring my sister?",
      "Of course. See you then.",
    ]);
  });

  it("switches conversation and updates the link", () => {
    renderPage();
    const nav = screen.getByRole("navigation", { name: "Conversations" });
    fireEvent.click(within(nav).getByRole("button", { name: /Heart Shelter · Max/ }));
    expect(screen.getByRole("heading", { name: "Heart Shelter · Max" })).not.toBeNull();
    expect(screen.getByTestId("where").textContent).toBe("?conversation=c1");
  });

  it("sends a message about the pet and clears the box", async () => {
    renderPage("/messages?conversation=c1");
    const input = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(input, { target: { value: "Hello there" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(hook.send).toHaveBeenCalledWith("p1", "Hello there"));
    await waitFor(() => expect(input.value).toBe(""));
  });

  it("does not allow sending an empty message", () => {
    renderPage("/messages?conversation=c1");
    expect(screen.getByRole("button", { name: "Send" }).disabled).toBe(true);
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: { value: "   " },
    });
    expect(screen.getByRole("button", { name: "Send" }).disabled).toBe(true);
  });

  it("shows why a message could not be sent and keeps the text", async () => {
    hook.send.mockResolvedValue({
      error: "We could not send your message. Please try again.",
    });
    renderPage("/messages?conversation=c1");
    const input = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(input, { target: { value: "Hello there" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("We could not send your message. Please try again.");
    expect(input.value).toBe("Hello there");
  });

  it("lets the demo shelter reply, and explains when that fails", async () => {
    renderPage("/messages?conversation=c1");
    fireEvent.click(screen.getByRole("button", { name: "Reply as shelter" }));
    await waitFor(() => expect(hook.demoShelterReply).toHaveBeenCalledWith("c1"));

    hook.demoShelterReply.mockResolvedValue({
      error: "The demo shelter is turned off.",
    });
    fireEvent.click(screen.getByRole("button", { name: "Reply as shelter" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("The demo shelter is turned off.");
  });

  it("shows an empty state with a link to browse pets", () => {
    hook.state.conversations = [];
    hook.state.messages = [];
    renderPage();
    expect(screen.getByText("No conversations yet")).not.toBeNull();
    expect(
      screen.getByRole("link", { name: "Browse pets" }).getAttribute("href"),
    ).toBe("/explore");
  });

  it("shows a loading message and an error message", () => {
    hook.state = { conversations: [], messages: [], loading: true, error: null };
    const { unmount } = renderPage();
    expect(screen.getByText("Loading your messages…")).not.toBeNull();
    unmount();

    hook.state = {
      conversations: [],
      messages: [],
      loading: false,
      error: "We could not load your messages.",
    };
    renderPage();
    expect(screen.getByRole("alert").textContent).toBe(
      "We could not load your messages.",
    );
  });
});