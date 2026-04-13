import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Phone, MoreVertical, User, Bot, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Conversations() {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/smclick-sessions");
      if (!res.ok) throw new Error("Erro ao buscar");
      const data = await res.json();
      setChats(data);
      if (!selectedChat && data.length > 0) {
        setSelectedChat(data[0]);
      } else if (selectedChat) {
        const updated = data.find((c: any) => c.id === selectedChat.id);
        if (updated) setSelectedChat(updated);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    const intv = setInterval(fetchChats, 5000); // Polling simple
    return () => clearInterval(intv);
  }, []);

  const assumeChat = async (id: string) => {
    await fetch(`/api/smclick-sessions/${id}/assume`, { method: "POST" });
    fetchChats();
  };

  // garantindo ordem temporal das msgs
  const messages = selectedChat?.smclick_messages 
    ? [...selectedChat.smclick_messages].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) 
    : [];

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6">
      {/* Chat List */}
      <Card className="w-80 flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-white">
          <div className="relative flex-1 mr-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input className="pl-9 bg-slate-50 border-none" placeholder="Buscar conversas..." />
          </div>
          <Button variant="ghost" size="icon" onClick={fetchChats}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={cn(
                "w-full p-4 flex gap-3 border-b hover:bg-slate-50 transition-colors text-left",
                selectedChat?.id === chat.id && "bg-blue-50 border-r-4 border-r-blue-600"
              )}
            >
              <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                  {chat.phone ? chat.phone.substring(2, 4) : "??"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm truncate">{chat.phone || chat.smclick_id}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(chat.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {chat.smclick_messages?.length 
                    ? chat.smclick_messages[chat.smclick_messages.length - 1].content 
                    : "Sem mensagens"}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Phone className="w-3 h-3 text-green-500" />
                  {!chat.is_human_attending ? (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-blue-100 text-blue-700 border-none">IA Ativa</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-slate-100 text-slate-600 border-none">Humano</Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
        </ScrollArea>
      </Card>

      {/* Chat Window */}
      {selectedChat ? (
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-700">
                   {selectedChat.phone ? selectedChat.phone.substring(2, 4) : "??"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">{selectedChat.phone || selectedChat.smclick_id}</h3>
                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                  WhatsApp • {selectedChat.is_human_attending ? "Aguardando Vendedor" : "Sendo atendido por IA"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!selectedChat.is_human_attending && (
                <Button variant="outline" size="sm" className="text-xs gap-2" onClick={() => assumeChat(selectedChat.id)}>
                  <User className="w-3 h-3" /> Assumir Conversa
                </Button>
              )}
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-6 bg-slate-50/50">
            <div className="space-y-6">
              {messages.map((msg: any, i: number) => (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.role === "bot" && <Bot className="w-3 h-3 text-blue-600" />}
                    {msg.role === "human" && <User className="w-3 h-3 text-slate-600" />}
                    <span className="text-[10px] text-slate-400 font-medium">
                      {msg.role === "user" ? "Cliente" : msg.role === "bot" ? "M2 IA" : "Vendedor"} • {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "px-4 py-2 rounded-2xl text-sm shadow-sm",
                      msg.role === "user" 
                        ? "bg-blue-600 text-white rounded-tr-none" 
                        : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Input 
                placeholder={selectedChat.is_human_attending ? "Digite sua mensagem..." : "Assuma a conversa para enviar mensagens."} 
                className="flex-1 bg-slate-50 border-none focus-visible:ring-blue-600" 
                disabled={!selectedChat.is_human_attending}
              />
              <Button className="bg-blue-600 hover:bg-blue-700" disabled={!selectedChat.is_human_attending}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {!selectedChat.is_human_attending && (
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                A IA está monitorando e respondendo esta conversa automaticamente.
              </p>
            )}
          </div>
        </Card>
      ) : (
        <Card className="flex-1 flex flex-col items-center justify-center text-slate-400">
          Nenhuma conversa encontrada.
        </Card>
      )}
    </div>
  );
}
