import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import PostItem from "../components/PostItem";
import BottomNav from "../components/BottomNav";
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

  // 🔄 carrega posts + likes do banco
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("id, content, created_at, author_id")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const enriched = await Promise.all(
        data.map(async (p: any) => {
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
          } as Post;
        })
      );
      setPosts(enriched);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // publicar novo post
  const handlePublish = async () => {
    if (!newPost.trim()) return;

    const { data, error } = await supabase
      .from("posts")
      .insert({
        content: newPost,
        author_id: user.id,
      })
      .select("id, content, created_at, author_id")
      .single();

    if (!error && data) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, university, avatar_url")
        .eq("id", data.author_id)
        .single();

      const { data: likes } = await supabase
        .from("likes")
        .select("user_id")
        .eq("post_id", data.id);

      const newFormatted: Post = {
        id: data.id,
        content: data.content,
        created_at: data.created_at,
        profiles: profile || null,
        likes: likes || [],
      };

      setPosts([newFormatted, ...posts]);
      setNewPost("");
    }
  };

  return (
    <div className="feed-container">
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

      <div className="new-post">
        <textarea
          placeholder="Compartilhe algo..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
        />
        <button onClick={handlePublish}>Publicar</button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : posts.length === 0 ? (
        <p>Seja o primeiro a postar 🎉</p>
      ) : (
        posts.map((post) => <PostItem key={post.id} post={post} />)
      )}

      <BottomNav />
    </div>
  );
}
