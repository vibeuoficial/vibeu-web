import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import PostItem from "../components/PostItem";
import BottomNav from "../components/BottomNav"; // 👈 importa o menu
import "./feed.css";

interface Profile {
  id: string;
  name: string;
  university: string | null;
  avatar_url?: string | null;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  profiles: Profile | null;
  likes: { user_id: string }[];
}

interface FeedProps {
  user: Profile;
}

export default function Feed({ user }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");

  // carregar posts
  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          content,
          created_at,
          profiles (id, name, university, avatar_url),
          likes(user_id)
        `)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const formatted = data.map((p: any) => ({
          ...p,
          profiles:
            p.profiles && Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
        }));
        setPosts(formatted as Post[]);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []);

  const handlePublish = async () => {
    if (!newPost.trim()) return;

    const { data, error } = await supabase
      .from("posts")
      .insert({
        content: newPost,
        author_id: user.id,
      })
      .select(`
        id,
        content,
        created_at,
        profiles (id, name, university, avatar_url),
        likes(user_id)
      `)
      .single();

    if (!error && data) {
      const normalized = {
        ...data,
        profiles:
          data.profiles && Array.isArray(data.profiles)
            ? data.profiles[0]
            : data.profiles,
      };
      setPosts([normalized as Post, ...posts]);
      setNewPost("");
    }
  };

  return (
    <div className="feed-container">
      {/* Cabeçalho */}
      <div className="feed-header">
        <h1>VibeU</h1>
        <div className="user-info">
          <img
            src={user.avatar_url || "/default-avatar.png"}
            alt={user.name}
            className="user-avatar"
          />
          <div>
            <div className="user-name">Olá, {user.name} 👋</div>
            {user.university && (
              <div className="user-uni">@{user.university}</div>
            )}
          </div>
        </div>
      </div>

      {/* Novo post */}
      <div className="new-post">
        <textarea
          placeholder="Compartilhe algo..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
        <button onClick={handlePublish}>Publicar</button>
      </div>

      {/* Lista de posts */}
      {loading ? (
        <p>Carregando...</p>
      ) : posts.length === 0 ? (
        <p>Seja o primeiro a postar 🎉</p>
      ) : (
        posts.map((post) => (
          <PostItem key={post.id} post={post} userId={user.id} />
        ))
      )}

      {/* Menu fixo no rodapé */}
      <BottomNav />
    </div>
  );
}
