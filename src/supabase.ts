import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sbbizjeyeobtqpepqbic.supabase.co"; // troque pelo seu
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiYml6amV5ZW9idHFwZXBxYmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2ODc4OTcsImV4cCI6MjA3MTI2Mzg5N30.f4RkWN_etLoSMhhHYyBXUJLdNjRssCnF5pORQ5Wq8TA"; // troque pelo seu
export const supabase = createClient(supabaseUrl, supabaseKey);
