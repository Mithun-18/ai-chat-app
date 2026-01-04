import { useEffect, useRef, useState } from "react";
import "./styles.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const getInitialMessages = () => {
  const saved = localStorage.getItem("chat_history");
  return saved
    ? JSON.parse(saved)
    : [{ isUser: false, mssg: "How Can I help You Today" }];
};

export default function WebSocketDemo() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState(() => getInitialMessages());
  const [aiReply, setAiReply] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);

  const inputRef = useRef(null);
  const replyRef = useRef("");
  const scrollRef = useRef(null);
  const bufferRef = useRef("");

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    inputRef.current.focus();
    setSocket(ws);

    // typing interval . renders 1 char in 30ms .
    const typingInterval = setInterval(() => {
      if (bufferRef.current?.length > 0) {
        const nextChar = bufferRef.current.charAt(0);
        bufferRef.current = bufferRef.current.substring(1);
        setAiReply((prev) => prev + nextChar);
      }
    }, 10);

    ws.onmessage = (event) => {
      if (event.data === "[END]") {
        //if all buffered is rendered then only set the message
        const checkDone = setInterval(() => {
          if (bufferRef.current.length === 0) {
            const aiMessage = replyRef.current;
            if (aiMessage) {
              setMessages((prev) => [
                ...prev,
                { isUser: false, mssg: aiMessage },
              ]);
            }
            replyRef.current = "";
            bufferRef.current = "";
            inputRef.current.focus();
            setAiReply("");
            setIsAiTyping(false);
            clearInterval(checkDone);
          }
        }, 100);
      } else {
        replyRef.current = replyRef.current + event.data;
        bufferRef.current = bufferRef.current + event.data;
      }
    };

    return () => {
      ws.close();
      clearInterval(typingInterval);
    };
  }, []);

  // scrolling to bottom of the message when message or aireply changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, aiReply]);

  useEffect(() => {
    if (messages.length > 0) {
      syncToLocalStorage(messages);
    }
  }, [messages]);

  const syncToLocalStorage = (messages) => {
    localStorage.setItem("chat_history", JSON.stringify(messages));
  };

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat?")) {
      setMessages([]);
      localStorage.removeItem("chat_history");
    }
  };

  const handleKeyDown = (e) => {
    if (!isAiTyping && !e.shiftKey && e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = () => {
    const userMessage = inputRef.current.value.trim();
    if (socket && userMessage) {
      setMessages((prev) => [...prev, { isUser: true, mssg: userMessage }]);
      socket.send(userMessage);
      inputRef.current.value = "";
      setIsAiTyping(true);
    }
  };

  return (
    <div className="chatWindow">
      <div className="chatHeader">
        <h2 style={{ padding: "16px" }}>React WebSocket Chat</h2>
        <div>
          <button onClick={clearChat} className="clearBtn">
            clear chat
          </button>
        </div>
      </div>

      <div className="messageContainer">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${msg?.isUser ? "messageBoxRight" : "messageBoxLeft"}`}
          >
            <div
              key={i}
              className={`message ${msg?.isUser ? "userMssg" : "aiReply"}`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.mssg}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        <div className="messageBoxLeft">
          {isAiTyping && (
            <div className="message aiReply aiTyping">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {aiReply}
              </ReactMarkdown>
              {aiReply && <span className="typingCursor">▌</span>}
            </div> // typing effect
          )}
        </div>
        <div ref={scrollRef} style={{ height: "1px" }}></div>
      </div>

      <div className="inputBoxContainer">
        <textarea
          id="textMssg"
          ref={inputRef}
          rows={4}
          placeholder="Type message"
          onKeyDown={handleKeyDown}
          className="inputBox"
        />
      </div>
    </div>
  );
}
