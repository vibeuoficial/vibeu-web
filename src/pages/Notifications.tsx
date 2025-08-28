import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Link } from "react-router-dom";
import "./notifications.css";

interface NotificationsProps {
  user: {
    id: string;
  };
}

export default function Notifications({ user }: NotificationsProps) {
  const [notifications, setNotifications] = useState<any[]>([]);

  // Buscar notificações do usuário logado
  useEffect(() => {
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id,
          type,
          created_at,
          seen,
          actor:actor_id (id, name, avatar_url),
          post:post_id (id, content)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setNotifications(data);
      }
    };

    fetchNotifications();

    // 🔴 realtime para novas notificações
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  // Marcar como lidas ao abrir a página
  useEffect(() => {
    const markSeen = async () => {
      await supabase
        .from("notifications")
        .update({ seen: true })
        .eq("user_id", user.id)
        .eq("seen", false);
    };
    markSeen();
  }, [user.id]);

  return (
    <div className="notifications-container">
      <h2>🔔 Notificações</h2>

      {notifications.length === 0 && (
        <p className="empty">Sem notificações ainda.</p>
      )}

      {notifications.map((n) => (
        <div
          key={n.id}
          className={`notification-card ${n.seen ? "" : "unread"}`}
        >
          <img
            src={n.actor?.avatar_url || "/default-avatar.png"}
            alt={n.actor?.name}
            className="notif-avatar"
          />
          <div>
            <p>
              <strong>{n.actor?.name}</strong>{" "}
              {n.type === "like" ? "curtiu" : "comentou"} sua postagem
            </p>
            <div className="notif-links">
              <Link to={`/profile/${n.actor?.id}`} className="notif-link">
                Ver perfil
              </Link>
              ·
              <Link to={`/post/${n.post?.id}`} className="notif-link">
                Ver post
              </Link>
            </div>
            <span className="notif-date">
              {new Date(n.created_at).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
