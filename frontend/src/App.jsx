import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import WebSocketDemo from "./components/WebSocketDemo";
import "./index.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <WebSocketDemo />
    </>
  );
}

export default App;
