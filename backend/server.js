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
      const userMessage = msg.toString();
      const stream = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: userMessage }],
        stream: true,
      });

      // Broadcast to all connected clients
      // wss.clients.forEach((client) => {
      //   if (client.readyState === 1) {
      //     client.send(`client says: ${msg}`);
      //   }
      // });

      for await (const chunk of stream) {
        const token = chunk.choices?.[0]?.delta?.content || "";
        socket.send(token); // send token to React
      }

      socket.send("[END]"); // tell React that message is completed
    });

    socket.on("close", () => {
      console.log("connection closed");
    });
  });
} catch (error) {
  console.log("error: ", error);
}

console.log("WebSocket server running on ws://localhost:8080");
