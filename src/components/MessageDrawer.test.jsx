import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MessageDrawer from "./MessageDrawer";

const hook = vi.hoisted(() => ({
  state: { conversations: [], messages: [] },
  send: vi.fn(),
}));

vi.mock("../hooks/useMessages", () => ({
  useMessages: () => ({ ...hook.state, send: hook.send }),
}));

const pet = { id: "p1", name: "Max", shelter: { name: "Heart Shelter" } };

function renderDrawer(onClose = vi.fn()) {
  render(
    <MemoryRouter>
      <MessageDrawer pet={pet} onClose={onClose} />
    </MemoryRouter>,
  );
  return onClose;
}

beforeEach(() => {
  hook.state = { conversations: [], messages: [] };
  hook.send.mockReset();
  hook.send.mockResolvedValue({ conversationId: "c1" });
});

describe("MessageDrawer", () => {
  it("is a dialog for the pet's shelter, with a hint when there is no history", () => {
    renderDrawer();
    expect(
      screen.getByRole("dialog", { name: "Message Heart Shelter" }),
    ).not.toBeNull();
    expect(screen.getByText("Ask Heart Shelter anything about Max.")).not.toBeNull();
    expect(screen.queryByRole("link", { name: "Open in Messages" })).toBeNull();
  });

  it("shows the existing thread and a link to the full page", () => {
    hook.state = {
      conversations: [
        { id: "c1", petId: "p1", shelterId: "s1", lastMessageAt: new Date(2026, 9, 19) },
      ],
      messages: [
        {
          id: "m1",
          conversationId: "c1",
          sender: "user",
          fromMe: true,
          body: "Is he good with kids?",
          createdAt: new Date(2026, 9, 19, 10, 0),
        },
      ],
    };
    renderDrawer();
    expect(screen.getByText("Is he good with kids?")).not.toBeNull();
    expect(
      screen.getByRole("link", { name: "Open in Messages" }).getAttribute("href"),
    ).toBe("/messages?conversation=c1");
  });

  it("sends a message about this pet and clears the box", async () => {
    renderDrawer();
    const input = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(hook.send).toHaveBeenCalledWith("p1", "Hello"));
    await waitFor(() => expect(input.value).toBe(""));
  });

  it("does not allow sending an empty message", () => {
    renderDrawer();
    expect(screen.getByRole("button", { name: "Send" }).disabled).toBe(true);
  });

  it("shows why sending failed and keeps the text", async () => {
    hook.send.mockResolvedValue({ error: "You cannot send that message." });
    renderDrawer();
    const input = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("You cannot send that message.");
    expect(input.value).toBe("Hello");
  });

  it("closes with the button, the backdrop and Escape", () => {
    const onClose = renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByTestId("message-drawer-backdrop"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("focuses the message box when it opens", () => {
    renderDrawer();
    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "Message" }),
    );
  });
});