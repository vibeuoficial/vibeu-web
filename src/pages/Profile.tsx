import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import PostItem from "../components/PostItem";
import { Menu } from "lucide-react"; // ícone hambúrguer
import "./profile.css";

interface ProfileProps {
  user: {
    id: string;
    name: string;
    email: string;
    university: string | null;
    birthdate: string | null;
    course: string | null;
    avatar_url?: string | null;
    languages?: string[] | string | null;
  };
}

export default function Profile({ user }: ProfileProps) {
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [editName, setEditName] = useState(user.name || "");
  const [editCourse, setEditCourse] = useState(user.course || "");
  const [editUniversity, setEditUniversity] = useState(user.university || "");
  const [editAvatar, setEditAvatar] = useState<File | null>(null);

  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || null);

  // logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Fecha menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const dropdown = document.getElementById("profile-menu-dropdown");
      const btn = document.getElementById("profile-menu-btn");
      if (
        showMenu &&
        dropdown &&
        btn &&
        !dropdown.contains(e.target as Node) &&
        !btn.contains(e.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showMenu]);

  // Idiomas com bandeiras
  const getFlag = (lang: string) => {
    const normalized = lang.toLowerCase();
    if (normalized.includes("port")) return "🇧🇷 Português";
    if (normalized.includes("ing")) return "🇬🇧 Inglês";
    if (normalized.includes("esp")) return "🇪🇸 Espanhol";
    if (normalized.includes("fran")) return "🇫🇷 Francês";
    if (normalized.includes("alem")) return "🇩🇪 Alemão";
    if (normalized.includes("ital")) return "🇮🇹 Italiano";
    return "🌐 " + lang;
  };

  const parseLanguages = (): string[] => {
    if (!user.languages) return [];
    if (Array.isArray(user.languages)) return user.languages;
    if (typeof user.languages === "string") {
      try {
        return JSON.parse(user.languages);
      } catch {
        return [];
      }
    }
    return [];
  };
  const langs = parseLanguages();

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("pt-PT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Carregar posts do user logado (versão manual)
  useEffect(() => {
    const fetchMyPosts = async () => {
      const { data: rawPosts, error } = await supabase
        .from("posts")
        .select("id, content, created_at, author_id")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && rawPosts) {
        const enriched = await Promise.all(
          rawPosts.map(async (p: any) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, name, university, avatar_url")
              .eq("id", p.author_id)
              .single();

            const { data: likes } = await supabase
              .from("likes")
              .select("user_id")
              .eq("post_id", p.id);

            return {
              id: p.id,
              content: p.content,
              created_at: p.created_at,
              profiles: profile || null,
              likes: likes || [],
            };
          })
        );

        setMyPosts(enriched);
      }
    };
    fetchMyPosts();
  }, [user.id]);

  // Atualizar perfil
  const handleSave = async () => {
    let newAvatarUrl = avatarUrl;

    if (editAvatar) {
      const fileExt = editAvatar.name.split(".").pop();
      const filePath = `${user.id}-avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, editAvatar, { upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        newAvatarUrl = data.publicUrl;
        setAvatarUrl(newAvatarUrl);
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: editName,
        course: editCourse,
        university: editUniversity,
        avatar_url: newAvatarUrl,
      })
      .eq("id", user.id);

    if (!error) {
      setShowModal(false);
    }
  };

  // Descobrir se o perfil sendo exibido é do próprio user logado
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setSessionUserId(data.user.id);
    };
    getUser();
  }, []);

  return (
    <div className="profile-container">
      {/* Menu só aparece se for o dono do perfil */}
      {sessionUserId === user.id && (
        <>
          <button
            id="profile-menu-btn"
            className="menu-btn"
            onClick={() => setShowMenu(!showMenu)}
          >
            <Menu size={24} />
          </button>

          {showMenu && (
            <div id="profile-menu-dropdown" className="menu-dropdown">
              <button onClick={() => setShowModal(true)}>✏️ Editar Perfil</button>
              <button onClick={handleLogout}>🚪 Logout</button>
            </div>
          )}
        </>
      )}

      <div className="profile-card">
        <img
          src={avatarUrl || "/default-avatar.png"}
          alt={user.name}
          className="profile-avatar"
        />
        <div className="profile-basic">
          <h2>{user.name}</h2>
          {sessionUserId === user.id && <p className="email">{user.email}</p>}
          <p className="uni">@{user.university}</p>
        </div>
        <div className="profile-info">
          <p><strong>📚 Curso:</strong> {user.course || "-"}</p>
          <p><strong>🎂 Data de nascimento:</strong> {formatDate(user.birthdate)}</p>
          <p><strong>🌍 Idiomas:</strong> {langs.length > 0 ? langs.map(getFlag).join(", ") : "🌐"}</p>
        </div>
      </div>

      <div className="my-posts">
        <h3>📌 Minhas postagens</h3>
        {myPosts.length === 0 ? (
          <p>Você ainda não publicou nada.</p>
        ) : (
          myPosts.map((post) => <PostItem key={post.id} post={post} />)
        )}
      </div>

      {sessionUserId === user.id && showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Editar Perfil</h3>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nome"
            />
            <input
              type="text"
              value={editCourse}
              onChange={(e) => setEditCourse(e.target.value)}
              placeholder="Curso"
            />
            <input
              type="text"
              value={editUniversity}
              onChange={(e) => setEditUniversity(e.target.value)}
              placeholder="Universidade"
            />
            <label className="upload-label">
              Alterar foto:
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditAvatar(e.target.files?.[0] || null)}
              />
            </label>
            <div className="modal-actions">
              <button className="save" onClick={handleSave}>Salvar</button>
              <button className="cancel" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
