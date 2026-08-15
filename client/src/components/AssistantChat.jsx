import { Bot, Send, X } from "lucide-react";
import { useState } from "react";
import { askAssistant } from "../services/api.js";
import TrustSeal from "./TrustSeal.jsx";

function AssistantChat({ currentUser, compact = false, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Tell me what is happening and where you are. I will keep it practical." }
  ]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();

    if(!message.trim()) {
      return;
    }

    const userText = message.trim();
    setMessages((old) => [...old, { role: "user", text: userText }]);
    setMessage("");
    setLoading(true);

    const data = await askAssistant({
      message: userText,
      locality: currentUser?.locality
    });

    setMessages((old) => [
      ...old,
      { role: "assistant", text: data.success ? data.reply : data.message }
    ]);
    setLoading(false);
  }

  return (
    <section className={compact ? "assistant-panel compact" : "assistant-panel full"}>
      <header className="assistant-header">
        <div>
          <p className="data-label">SAFETY ASSISTANT</p>
          <h2>Ask EmpowHer</h2>
        </div>
        {onClose && (
          <button className="icon-button" onClick={onClose} aria-label="Close assistant">
            <X size={18} />
          </button>
        )}
      </header>

      <div className="assistant-messages">
        {messages.map((item, index) => (
          <article key={`${item.role}-${index}`} className={`chat-row ${item.role}`}>
            {item.role === "assistant" && <TrustSeal label="GUIDANCE" />}
            <p>{item.text}</p>
          </article>
        ))}
        {loading && (
          <article className="chat-row assistant">
            <TrustSeal label="GUIDANCE" />
            <p>Preparing a short response...</p>
          </article>
        )}
      </div>

      <form onSubmit={submit} className="assistant-form">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ask about a route, alert, or next step"
        />
        <button className="icon-button primary" aria-label="Send message">
          <Send size={18} />
        </button>
      </form>
    </section>
  );
}

export function AssistantBubble({ currentUser }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="assistant-bubble-wrap">
      <div id="sos-slot" />
      {open && <AssistantChat currentUser={currentUser} compact onClose={() => setOpen(false)} />}
      <button className="assistant-bubble" onClick={() => setOpen((value) => !value)} aria-label="Open assistant">
        <Bot size={22} />
      </button>
    </div>
  );
}

export default AssistantChat;
