// ======================================================
// PROJETO CORAGEM - CONFIGURAÇÃO SUPABASE
// ======================================================

const SUPABASE_URL =
    "https://npppfkantotzijnxxdaj.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_VUdqIbO7C4aDji_2asOXOQ_Qj5XGA42";


// Verifica se a biblioteca do Supabase foi carregada
if (!window.supabase) {
    throw new Error(
        "A biblioteca Supabase JS não foi carregada."
    );
}


// Cria o cliente do Supabase
window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);


console.log(
    "Supabase conectado:",
    SUPABASE_URL
);