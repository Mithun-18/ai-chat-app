import { useEffect, useRef, useState } from "react";
import "./styles.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { STATUS, THEME } from "../constans";
import useTheme from "../hooks/useTheme";

const getInitialMessages = () => {
  const saved = localStorage.getItem("chat_history");
  return saved
    ? JSON.parse(saved)
    : [{ isUser: false, mssg: "How Can I help You Today" }];
};

export default function WebSocketDemo() {
  const { theme, toggleTheme } = useTheme();

  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState(() => getInitialMessages());
  const [aiReply, setAiReply] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [status, setStatus] = useState(STATUS.connecting);

  const inputRef = useRef(null);
  const replyRef = useRef("");
  const scrollRef = useRef(null);
  const bufferRef = useRef("");

  const disabelSendMessage = isAiTyping || !textValue || status !== STATUS.open;

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket("ws://localhost:8080");

      ws.onopen = () => setStatus(STATUS.open);

      inputRef.current.focus();
      setSocket(ws);

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

      ws.onclose = () => {
        setStatus(STATUS.closed);
        setTimeout(connect, 6000);
      };

      ws.onerror = () => setStatus(STATUS.error);
    };
    connect();

    // typing interval . renders 1 char in 30ms .
    const typingInterval = setInterval(() => {
      if (bufferRef.current?.length > 0) {
        const nextChar = bufferRef.current.charAt(0);
        bufferRef.current = bufferRef.current.substring(1);
        setAiReply((prev) => prev + nextChar);
      }
    }, 10);

    return () => {
      socket?.close();
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

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      const newHeight = Math.min(inputRef.current.scrollHeight, 360);
      inputRef.current.style.height = `${newHeight}px`;
      inputRef.current.style.overflowY =
        inputRef.current.scrollHeight > 360 ? "auto" : "hidden";
    }
  }, [textValue]);

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
    if (
      !disabelSendMessage &&
      !isAiTyping &&
      !e.shiftKey &&
      e.key === "Enter"
    ) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = () => {
    const userMessage = inputRef.current.value.trim();
    if (socket && userMessage) {
      const utterance = new SpeechSynthesisUtterance(userMessage);
      window.speechSynthesis.speak(utterance);
      setMessages((prev) => [...prev, { isUser: true, mssg: userMessage }]);
      socket.send(userMessage);
      inputRef.current.value = "";
      setIsAiTyping(true);
    }
  };

  return (
    <div className="chatWindow">
      {/* Glassmorphism Header */}
      <header className="chatHeader">
        <div className="headerBrand">
          <div className="topHeader">
            <div className="statusSection">
              <div className={`statusDot ${status}`}></div>
              {status === "closed" && (
                <span className="retryText">Reconnecting...</span>
              )}
            </div>
            <div className="headerActions">
              <button onClick={clearChat} className="clearBtn">
                {/* Consider adding a small trash icon here later */}
                Clear Chat
              </button>
              <button
                onClick={toggleTheme}
                className="themeBtn"
                title="Toggle Theme"
              >
                {theme === THEME.light ? "🌙" : "☀️"}
              </button>
            </div>
          </div>
          <h2 className="chatHeaderTitle">AI Assistant</h2>
        </div>
      </header>

      <div className="messageContainer">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`messageRow ${msg?.isUser ? "rowRight" : "rowLeft"}`}
          >
            <div
              className={`messageBubble ${msg?.isUser ? "userBubble" : "aiBubble"}`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.mssg}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {isAiTyping && (
          <div className="messageRow rowLeft">
            <div className="messageBubble aiBubble">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {aiReply}
              </ReactMarkdown>
              <span className="typingCursor">▌</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <footer className="inputArea">
        <div className="inputWrapper">
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Ask me anything..."
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="premiumInput"
          />
          <button
            className="sendIcon"
            onClick={sendMessage}
            disabled={disabelSendMessage}
            style={{
              opacity: disabelSendMessage ? 0.4 : 1,
              cursor: disabelSendMessage ? "default" : "pointer",
            }}
          >
            <span style={{ fontSize: "24px", fontWeight: "bold" }}>↑</span>
          </button>
        </div>
        <p className="footerNotice">© {new Date().getFullYear()} Mithun</p>
      </footer>
    </div>
  );
}
