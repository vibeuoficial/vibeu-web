import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  name: string;
  university: string | null;
  avatar_url?: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: Profile | null;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  profiles: Profile | null;
  likes: { user_id: string }[];
}

interface PostItemProps {
  post: Post;
  userId: string;
}

export default function PostItem({ post, userId }: PostItemProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [liked, setLiked] = useState(
    post.likes?.some((l) => l.user_id === userId) || false
  );
  const [showComments, setShowComments] = useState(false);
  const navigate = useNavigate();

  // carregar comentários
  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          profiles (id, name, university, avatar_url)
        `)
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        const formatted = data.map((c: any) => ({
          ...c,
          profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
        }));
        setComments(formatted as Comment[]);
      }
    };
    fetchComments();
  }, [post.id]);

  // curtir / descurtir
  const handleLike = async () => {
    if (liked) {
      // remover like
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", userId);

      setLikes(likes - 1);
      setLiked(false);
    } else {
      // verifica se já existe
      const { data: existing } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from("likes").insert({
          post_id: post.id,
          user_id: userId,
        });

        if (!error) {
          setLikes(likes + 1);
          setLiked(true);
        }
      }
    }
  };

  // comentar
  const handleComment = async () => {
    if (!newComment.trim()) return;

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: post.id,
        user_id: userId,
        content: newComment,
      })
      .select(`
        id,
        content,
        created_at,
        profiles (id, name, university, avatar_url)
      `)
      .single();

    if (!error && data) {
      const formatted = {
        ...data,
        profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
      };
      setComments([...comments, formatted as Comment]);
      setNewComment("");
    }
  };

  return (
    <div className="post-card">
      {/* Cabeçalho */}
      <div className="post-header">
        <img
          src={post.profiles?.avatar_url || "/default-avatar.png"}
          alt={post.profiles?.name}
          className="post-avatar"
          onClick={() => navigate(`/profile/${post.profiles?.id}`)}
          style={{ cursor: "pointer" }}
        />
        <div>
          <span
            className="author-name"
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/profile/${post.profiles?.id}`)}
          >
            {post.profiles?.name || "Usuário"}
          </span>
          {post.profiles?.university && (
            <span className="user-uni"> @{post.profiles.university}</span>
          )}
          <div className="post-date">
            {new Date(post.created_at).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <p>{post.content}</p>

      {/* Ações */}
      <div className="actions">
        <button onClick={handleLike}>
          {liked ? "💜" : "🤍"} {likes}
        </button>
        <button onClick={() => setShowComments(!showComments)}>
          💬 {comments.length}
        </button>
      </div>

      {/* Comentários */}
      {showComments && (
        <div className="comments">
          {comments.map((c) => (
            <div key={c.id} className="comment">
              <div className="comment-header">
                <img
                  src={c.profiles?.avatar_url || "/default-avatar.png"}
                  alt={c.profiles?.name}
                  className="comment-avatar"
                />
                <div>
                  <span className="author-name">
                    {c.profiles?.name || "Usuário"}
                  </span>
                  {c.profiles?.university && (
                    <span className="user-uni"> @{c.profiles.university}</span>
                  )}
                  <div className="comment-date">
                    {new Date(c.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <p>{c.content}</p>
            </div>
          ))}

          {/* Caixa de comentário */}
          <div className="comment-box">
            <input
              type="text"
              placeholder="Escreva um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button onClick={handleComment}>Comentar</button>
          </div>
        </div>
      )}
    </div>
  );
}
