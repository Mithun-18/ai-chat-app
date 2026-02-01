import "dotenv/config";
import { WebSocketServer } from "ws";
import OpenAI from "openai";

const wss = new WebSocketServer({ port: 8080 });
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

try {
  wss.on("connection", (socket) => {
    console.log("connected to ws");

    // When client sends message
    socket.on("message", async (msg) => {
      try {
        const userMessage = msg.toString();
        const stream = await client.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: [{ role: "user", content: userMessage }],
          stream: true,
        });

        for await (const chunk of stream) {
          const token = chunk.choices?.[0]?.delta?.content || "";
          socket.send(token); // send token to React
        }

        socket.send("[END]"); // tell React that message is completed
      } catch (error) {
        console.log("openai error: ", error);
        socket.send("ERROR: Something went wrong");
        socket.send("[END]"); // tell React that message is completed
      }
    });

    socket.on("close", () => {
      console.log("connection closed");
    });
  });
} catch (error) {
  console.log("error: ", error);
}

console.log("WebSocket server running on ws://localhost:8080");
