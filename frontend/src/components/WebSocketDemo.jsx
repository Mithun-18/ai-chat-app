import { useCallback, useEffect, useState } from "react";
import "./styles.css";

export default function WebSocketDemo() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([
    { isUser: true, mssg: "What's up" },
    { isUser: false, mssg: "Fine" },
    { isUser: true, mssg: "What's up" },
  ]);
  const [text, setText] = useState("");
  const [aiReply, setAiReply] = useState("");

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    setSocket(ws);

    ws.onmessage = (event) => {
      console.log("event", event);
      if (event.data === "[END]") {
        console.log("here", aiReply);
        setMessages((prev) => [...prev, { isUser: false, mssg: aiReply }]);
        setAiReply("");
      } else {
        setAiReply((prev) => prev + event.data);
      }
    };

    return () => {
      ws.close();
    };
  }, [aiReply]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = () => {
    if (socket && text.trim()) {
      setMessages((prev) => [...prev, { isUser: true, mssg: text.trim() }]);
      socket.send(text);
      setText("");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>React WebSocket Chat</h2>

      <div>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${msg?.isUser ? "messageBoxRight" : "messageBoxLeft"}`}
          >
            <p
              key={i}
              className={`message ${msg?.isUser ? "userMssg" : "aiReply"}`}
            >
              {msg.mssg}
            </p>
          </div>
        ))}
        <div className="messageBoxLeft">
          {aiReply && (
            <p className="aiReply">
               {aiReply}▌
            </p> // typing effect
          )}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <input
          id="textMssg"
          type="text-area"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message"
          onKeyDown={handleKeyDown}
          className="inputBox"
          disabled={aiReply !== ""}
        />
      </div>
    </div>
  );
}
