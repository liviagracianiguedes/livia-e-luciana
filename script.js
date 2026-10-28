
const SUPABASE_URL = "https://kgmnubmamtlhdezqjorn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnbW51Ym1hbXRsaGRlenFqb3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxOTg4ODksImV4cCI6MjEwODc3NDg4OX0.g6qqlHhHoIhlk6pahf4P4P4W86G_q9jrhM1xpMLTnqk";

const loginView = document.getElementById("login-view");
const privateView = document.getElementById("private-view");
const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-button");
const loginMessage = document.getElementById("login-message");
const privateMessage = document.getElementById("private-message");
const logoutButton = document.getElementById("logout-button");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("toggle-password");

let supabaseClient = null;
let authListener = null;

function showLogin(message = "") {
  loginView.hidden = false;
  privateView.hidden = true;
  loginMessage.textContent = message;
}
function showPrivateArea(user) {
  loginView.hidden = true;
  privateView.hidden = false;
  document.getElementById("user-email").textContent = user.email || "Usuário autenticado";
  document.getElementById("user-initial").textContent = (user.email || "U").charAt(0).toUpperCase();
  privateMessage.textContent = "";
}
function setLoading(loading) {
  loginButton.disabled = loading;
  loginButton.querySelector("span").textContent = loading ? "Verificando..." : "Entrar na minha conta";
}

function initializeSupabase() {
  const configMissing = SUPABASE_URL.startsWith("COLE_AQUI") || SUPABASE_ANON_KEY.startsWith("COLE_AQUI");
  if (configMissing) {
    showLogin("Configure a Project URL e a chave publicável no arquivo script.js antes de fazer login.");
    loginButton.disabled = true;
    return;
  }
  if (!window.supabase?.createClient) {
    showLogin("Não foi possível carregar o Supabase. Verifique sua conexão e atualize a página.");
    return;
  }
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data } = supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (session?.user) showPrivateArea(session.user);
    else showLogin();
  });
  authListener = data.subscription;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) {
    showLogin("Primeiro configure as credenciais do Supabase no arquivo script.js.");
    return;
  }
  const email = document.getElementById("email").value.trim();
  const password = passwordInput.value;
  loginMessage.textContent = "";
  setLoading(true);
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) showPrivateArea(data.user);
  } catch (error) {
    // Mensagem genérica para não revelar se um e-mail existe no projeto.
    showLogin("Não foi possível entrar. Confira o e-mail e a senha e tente novamente.");
    console.error("Falha de autenticação:", error.message);
  } finally {
    setLoading(false);
  }
});

logoutButton.addEventListener("click", async () => {
  if (!supabaseClient) return;
  logoutButton.disabled = true;
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    showLogin();
    loginForm.reset();
  } catch (error) {
    privateMessage.textContent = "Não foi possível encerrar a sessão. Tente novamente.";
    console.error("Falha ao sair:", error.message);
  } finally {
    logoutButton.disabled = false;
  }
});

togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  togglePassword.textContent = isPassword ? "Ocultar" : "Mostrar";
  togglePassword.setAttribute("aria-label", isPassword ? "Ocultar senha" : "Mostrar senha");
});

window.addEventListener("beforeunload", () => authListener?.unsubscribe());
initializeSupabase();
