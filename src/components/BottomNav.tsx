import React, { useEffect, useState } from "react";
import { Home, GraduationCap, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import "./bottomNav.css";

export default function BottomNav() {
  const [active, setActive] = useState("home");
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Buscar notificações não lidas e ativar realtime
  useEffect(() => {
    const fetchUnread = async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("seen", false);

      if (!error) {
        setUnreadCount(count || 0);
      }
    };

    fetchUnread();

    // Realtime: escuta novas notificações
    const channel = supabase
      .channel("notifications-badge")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        async () => {
          // quando marcar como seen, recalcula
          fetchUnread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <nav className="bottom-nav">
      {/* Feed */}
      <button
        className={`nav-item ${active === "home" ? "active" : ""}`}
        onClick={() => {
          setActive("home");
          navigate("/");
        }}
        title="Início"
      >
        <Home size={24} />
      </button>

      {/* Notificações */}
      <button
        className={`nav-item ${active === "notifications" ? "active" : ""}`}
        onClick={() => {
          setActive("notifications");
          navigate("/notifications");
          setUnreadCount(0); // limpa badge ao abrir
        }}
        title="Notificações"
        style={{ position: "relative" }}
      >
        <GraduationCap size={24} />
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </button>

      {/* Perfil */}
      <button
        className={`nav-item ${active === "profile" ? "active" : ""}`}
        onClick={() => {
          setActive("profile");
          navigate("/me");
        }}
        title="Perfil"
      >
        <User size={24} />
      </button>
    </nav>
  );
}
