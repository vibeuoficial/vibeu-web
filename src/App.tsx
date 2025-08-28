import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
import Notifications from "./pages/Notifications";
import Signin from "./pages/signin";
import OnboardingWizard from "./components/OnboardingWizard";
import Feed from "./pages/feed";
import Profile from "./pages/Profile";
import BottomNav from "./components/BottomNav";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      if (data.session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, name, email, university, course, avatar_url, birthdate, languages")
          .eq("id", data.session.user.id)
          .maybeSingle();

        setProfile(profile);

        if (
          profile &&
          profile.name &&
          profile.university &&
          profile.course &&
          profile.avatar_url
        ) {
          setOnboarded(true);
        } else {
          setOnboarded(false);
        }
      }
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          setOnboarded(null);
          setProfile(null);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!session) return <Signin onLogin={(s) => setSession(s)} />;
  if (onboarded === false) return <OnboardingWizard onDone={() => setOnboarded(true)} />;

  if (onboarded && profile) {
    return (
      <Router>
        <>
          <Routes>
            {/* Feed padrão */}
            <Route path="/" element={<Feed user={profile} />} />

            <Route path="/notifications" element={<Notifications user={profile} />} />


            {/* Perfil do próprio user logado */}
            <Route path="/me" element={<Profile user={profile} />} />

            {/* Perfil de qualquer usuário */}
            <Route path="/profile/:id" element={<ProfileWrapper />} />
          </Routes>

          {/* Bottom nav aparece em todas as páginas */}
          <BottomNav />
        </>
      </Router>
    );
  }

  return null;
}

/* ==== Wrapper que carrega perfil pelo id da URL ==== */
function ProfileWrapper() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, email, university, course, avatar_url, birthdate, languages")
        .eq("id", id)
        .maybeSingle();

      setProfile(data);
    };
    fetchProfile();
  }, [id]);

  if (!profile) return <p>Carregando perfil...</p>;

  return <Profile user={profile} />;
}
