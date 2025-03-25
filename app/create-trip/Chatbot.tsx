// app/create-trip/Chatbot.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PawPrint, Send, X } from "lucide-react";


interface ChatbotProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Chatbot({ isOpen, setIsOpen }: ChatbotProps) {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([
    { sender: "bot", text: "Welcome to Wags & Wanders! I’m here to help you plan your pet-friendly trip. What would you like to know?" },
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
    <div className="fixed lg:static bottom-4 left-4 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-brand-teal hover:bg-brand-pink text-white rounded-full p-4"
        >
          <PawPrint className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="w-full lg:w-80 h-[500px] border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between bg-brand-teal text-white">
            <CardTitle className="text-lg">Travel Assistant</CardTitle>
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-brand-pink"
            >
              <X className="h-5 w-5" />
            </Button>
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
      )}
    </div>
  );
}