"use client";

import { useState, useEffect } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [showNgrokWarning, setShowNgrokWarning] = useState(false);
  const [sessionId, setSessionId] = useState("");

  const testWebhook = async () => {
    const url = 'https://resolved-imp-fair.ngrok-free.app/webhook-test/5f0b1d09-a2f6-48df-9aa6-fc8180e093a7?message=test';
    try {
      const response = await fetch(url, { method: 'GET' });
      const text = await response.text();
      console.log('Test webhook response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: text
      });
    } catch (error) {
      console.error('Test webhook error:', error);
    }
  };

  // Initialize session ID and test webhook when component mounts
  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    testWebhook();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    setMessages(prev => [...prev, { sender: "user", text: input }]);
    const currentInput = input;
    setInput(""); // Clear input immediately for better UX

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          sessionId: sessionId
        })
      });

      const data = await response.json();
      console.log("Webhook response:", data);

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }

      // Add bot response to chat with the actual webhook response
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: typeof data === 'string' ? data : 
              data.reply ? data.reply :
              data.output ? data.output :
              data.text ? data.text :
              data.message ? data.message :
              typeof data === 'object' ? Object.values(data)[0] :
              String(data)
      }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: `Error: ${error instanceof Error ? error.message : String(error)}` 
      }]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-4 max-w-2xl mx-auto">
      {showNgrokWarning && (
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
          <h3 className="font-bold mb-2">⚠️ Ngrok Warning</h3>
          <p>Please follow these steps:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Click this link to open your webhook: <a 
              href="https://resolved-imp-fair.ngrok-free.app/webhook-test/5f0b1d09-a2f6-48df-9aa6-fc8180e093a7?message=test" 
              target="_blank" 
              className="text-blue-600 underline"
              rel="noopener noreferrer"
            >Open webhook</a></li>
            <li>Accept the ngrok warning in the new tab</li>
            <li>Come back here and try sending your message again</li>
          </ol>
        </div>
      )}
      <div className="flex-1 overflow-auto space-y-4 mb-4 p-4 border rounded-lg bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-[70%] ${
                message.sender === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-lg"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
