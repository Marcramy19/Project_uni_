"use client";

import { useState } from "react";


const N8N_URL = process.env.NEXT_PUBLIC_N8N_BASE_URL;
const N8N_PATH = process.env.NEXT_PUBLIC_N8N_WEBHOOK_PATH;
if (typeof window !== "undefined") {
  console.log("N8N_URL", N8N_URL, "N8N_PATH", N8N_PATH);
}

export default function ChatBot() {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async (input: string) => {
    const url = `${N8N_URL}${N8N_PATH}?message=${encodeURIComponent(input)}`;
    console.log("Sending to n8n:", url); // Debug line
    const res = await fetch(url, {
      method: "GET",
    });
    if (!res.ok) throw new Error("Failed to fetch from n8n");
    const data = await res.json().catch(() => null);
    return data?.reply || "✅ Sent to n8n";
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    try {
      const reply = await sendMessage(input);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: reply },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "❌ Error connecting to n8n" },
      ]);
    }

    setInput("");
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-2xl p-4 flex flex-col space-y-4">
        <div className="flex-1 overflow-y-auto h-80 border p-2 rounded">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`mb-2 ${m.sender === "user" ? "text-right" : "text-left"}`}
            >
              <span
                className={`px-3 py-1 rounded-lg inline-block ${
                  m.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                {m.text}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
            placeholder="Type a message..."
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
