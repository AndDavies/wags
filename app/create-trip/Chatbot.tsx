// app/create-trip/Chatbot.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

export default function Chatbot() {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([
    { sender: "bot", text: "I am your travel chatbot! How can I assist you today?" },
  ]);
  const [input, setInput] = useState("");

  const handleSendMessage = () => {
    if (!input.trim()) return;

    setMessages([...messages, { sender: "user", text: input }]);
    // Placeholder for bot response
    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: "I’m here to assist! For now, this is a placeholder response. What else can I help with?" },
    ]);
    setInput("");
  };

  return (
    <Card className="w-full lg:w-80 h-[500px] border-none shadow-md">
      <CardHeader className="bg-brand-teal text-white">
        <CardTitle className="text-lg">Travel Assistant</CardTitle>
      </CardHeader>
      <CardContent className="p-4 h-[400px] overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.sender === "user"
                    ? "bg-brand-teal text-white"
                    : "bg-gray-100 text-offblack"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <div className="p-4 border-t border-brand-teal/50 flex items-center gap-2">
        <Input
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="border-brand-teal/50"
          onKeyPress={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
        />
        <Button
          onClick={handleSendMessage}
          className="bg-brand-teal hover:bg-brand-pink text-white"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  );
}