// components/app/notifications.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Notification {
  id: string;
  message: string;
  read: boolean;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("id, message, read")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
      } else {
        setNotifications(data || []);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) => [{ ...payload.new } as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (!error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-brand-teal hover:bg-brand-pink text-white rounded-full p-2"
      >
        <PawPrint className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute top-12 right-0 w-80 border-none shadow-md mt-2 animate-slideDown">
          <CardHeader>
            <CardTitle className="text-xl text-brand-teal flex items-center gap-2">
              <PawPrint className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-offblack/70 text-center">No notifications yet.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`flex justify-between items-center p-2 rounded ${
                      notification.read ? "bg-brand-teal/5" : "bg-brand-pink/10"
                    }`}
                  >
                    <span className="text-offblack text-sm">{notification.message}</span>
                    {!notification.read && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-brand-teal text-brand-teal hover:bg-brand-teal/10 text-xs"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Mark Read
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}