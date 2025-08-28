import { supabase } from "../supabase";
import "./signin.css";
import StudentsImg from "../assets/students.png";
import AppleIcon from "../assets/apple-icon.png"; // 👈 importa o ícone da Apple

export default function Signin({ onLogin }: { onLogin: (user: any) => void }) {
  const handleLogin = async (provider: "google" | "apple") => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
    });

    if (error) {
      console.error("Erro ao logar:", error.message);
    } else {
      console.log("Login iniciado:", data);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-container">
        <h1 className="logo">VibeU ✨</h1>
        <p className="subtitle">Conecte-se com estudantes em Portugal!</p>

        <button className="google-btn" onClick={() => handleLogin("google")}>
          <img
            src="https://www.svgrepo.com/show/355037/google.svg"
            alt="Google"
          />
          Entrar com Google
        </button>

        <button className="apple-btn" onClick={() => handleLogin("apple")}>
          <img src={AppleIcon} alt="Apple" />
          Entrar com Apple
        </button>

        {/* 👇 imagem controlada por CSS */}
        <img src={StudentsImg} alt="Estudantes" className="illustration" />
      </div>
    </div>
  );
}
