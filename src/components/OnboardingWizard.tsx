import React, { useState } from "react";
import { supabase } from "../supabase";
import "./onboardingwizard.css";

interface OnboardingWizardProps {
  onDone: () => void;
}

const universities = [
  "Universidade de Lisboa",
  "Universidade do Porto",
  "Universidade de Coimbra",
  "Universidade Nova de Lisboa",
  "Universidade de Aveiro",
  "Universidade do Minho",
  "Universidade da Beira Interior",
  "Universidade de Évora",
  "Universidade dos Açores",
  "Universidade da Madeira",
  "Universidade Católica Portuguesa",
  "Instituto Politécnico de Lisboa",
  "Instituto Politécnico do Porto",
  "Instituto Politécnico de Coimbra",
  "Instituto Politécnico de Leiria",
  "Instituto Politécnico de Bragança",
  "Instituto Politécnico de Setúbal",
  "ISCTE – Instituto Universitário de Lisboa",
  "Universidade Fernando Pessoa",
  "Universidade Lusíada",
];

const courses = [
  "Engenharia Informática",
  "Medicina",
  "Direito",
  "Psicologia",
  "Arquitetura",
  "Engenharia Civil",
  "Gestão",
  "Economia",
  "Biologia",
  "Química",
  "Farmácia",
  "Enfermagem",
  "Educação Básica",
  "Sociologia",
  "Ciência Política",
  "História",
  "Filosofia",
  "Design",
  "Marketing",
  "Comunicação Social",
];

export default function OnboardingWizard({ onDone }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: "",
    birthdate: "",
    languages: [] as string[],
    university: "",
    course: "",
    photo: null as File | null,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setForm((prev) => ({ ...prev, photo: e.target.files![0] }));
    }
  };

  const toggleLanguage = (lang: string) => {
    setForm((prev) => {
      const already = prev.languages.includes(lang);
      if (already) {
        return { ...prev, languages: prev.languages.filter((l) => l !== lang) };
      }
      if (prev.languages.length >= 3) return prev; // máximo 3
      return { ...prev, languages: [...prev.languages, lang] };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error("Usuário não autenticado.");
      setLoading(false);
      return;
    }
    const user = session.user;

    let avatar_url = null;
    if (form.photo) {
      const fileExt = form.photo.name.split(".").pop();
      const filePath = `${user.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, form.photo, { upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        avatar_url = data.publicUrl;
      } else {
        console.error("Erro upload:", uploadError.message);
      }
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      name: form.name,
      birthdate: form.birthdate,
      university: form.university,
      course: form.course,
      avatar_url,
      languages: form.languages,
    });

    setLoading(false);

    if (!error) {
      onDone();
    } else {
      console.error("Erro ao salvar:", error.message);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="progress">
          <div className="progress-bar" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {step === 1 && (
          <div className="step">
            <h2>👋 Vamos começar!</h2>
            <input
              type="text"
              name="name"
              placeholder="Seu nome"
              value={form.name}
              onChange={handleChange}
            />
            <input
              type="date"
              name="birthdate"
              value={form.birthdate}
              onChange={handleChange}
            />
            <p>Selecione até 3 idiomas que fala:</p>
            <div className="languages">
              {["Português", "Inglês", "Espanhol", "Francês"].map((lang) => (
                <span
                  key={lang}
                  className={`chip ${form.languages.includes(lang) ? "selected" : ""}`}
                  onClick={() => toggleLanguage(lang)}
                >
                  {lang}
                </span>
              ))}
            </div>
            <div className="buttons">
              <button disabled>Voltar</button>
              <button onClick={() => setStep(2)} disabled={!form.name || !form.birthdate}>
                Próximo
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step">
            <h2>🎓 Sua vida acadêmica</h2>
            <select
              name="university"
              value={form.university}
              onChange={handleChange}
            >
              <option value="">Selecione sua universidade</option>
              {universities.map((u, i) => (
                <option key={i} value={u}>{u}</option>
              ))}
            </select>
            <select
              name="course"
              value={form.course}
              onChange={handleChange}
            >
              <option value="">Selecione seu curso</option>
              {courses.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
            <div className="buttons">
              <button onClick={() => setStep(1)}>Voltar</button>
              <button onClick={() => setStep(3)} disabled={!form.university || !form.course}>
                Próximo
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step">
            <h2>📸 Escolha sua foto</h2>
            <input type="file" accept="image/*" onChange={handlePhoto} />
            <div className="buttons">
              <button onClick={() => setStep(2)}>Voltar</button>
              <button onClick={handleSubmit} disabled={loading}>
                {loading ? "Salvando..." : "Concluir"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
