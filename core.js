/* =========================================================
   PROJETO CORAGEM
   CORE.JS — VERSÃO SUPABASE
   BLOCO 1/4
   ========================================================= */

(() => {
'use strict';

/* =========================================================
   1. SUPABASE
   ========================================================= */

const supabase = window.supabaseClient;

if (!supabase) {
    throw new Error(
        'Supabase não foi inicializado. ' +
        'Verifique se supabase-config.js está carregado antes de core.js.'
    );
}


/* =========================================================
   2. CONFIGURAÇÕES PADRÃO
   ========================================================= */

const defaultSettings = {

    institution: 'Projeto Coragem',

    tagline: 'Trabalho • Lazer • Educação',

    showRanking: true,

    allowRetake: true,

    pointsComplete: 100,

    pointsCorrect: 20

};


/* =========================================================
   3. CACHE LOCAL DA APLICAÇÃO
   =========================================================

   IMPORTANTE:

   Isto NÃO é localStorage.

   É apenas memória temporária enquanto a página está aberta.

   Os dados reais continuam no Supabase.
   ========================================================= */

const cache = {

    users: [],

    contents: [],

    results: [],

    materials: [],

    notices: [],

    settings: {
        ...defaultSettings
    },

    session: null

};


/* =========================================================
   4. FUNÇÕES UTILITÁRIAS
   ========================================================= */

function digits(value) {

    return String(value || '')
        .replace(/\D/g, '');

}


function uid(prefix = 'id') {

    return (
        prefix +
        '-' +
        Date.now().toString(36) +
        '-' +
        Math.random().toString(36).slice(2, 7)
    );

}


function nowISO() {

    return new Date().toISOString();

}


function esc(value = '') {

    return String(value).replace(
        /[&<>"']/g,
        character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]
    );

}


function normalize(value) {

    return String(value || '')
        .trim()
        .toLocaleLowerCase('pt-BR');

}


function v(id) {

    return (
        document.getElementById(id)?.value || ''
    ).trim();

}


/* =========================================================
   5. FORMATAÇÃO DE DATA
   ========================================================= */

function fmtDate(value, withTime = false) {

    if (!value) {

        return '—';

    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {

        return esc(value);

    }

    if (withTime) {

        return date.toLocaleString(
            'pt-BR',
            {
                dateStyle: 'short',
                timeStyle: 'short'
            }
        );

    }

    return date.toLocaleDateString('pt-BR');

}


/* =========================================================
   6. MENSAGENS DA INTERFACE
   ========================================================= */

function msg(text, type = 'success') {

    const element =
        document.querySelector(
            '#message, .message'
        );

    if (!element) {

        console.log(text);

        return;

    }

    element.textContent = text;

    element.className =
        'message ' + type;

    element.style.display = 'block';

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

}


/* =========================================================
   7. MÁSCARA DE CPF
   ========================================================= */

function maskCPF(value) {

    let cpf =
        digits(value)
            .slice(0, 11);

    cpf =
        cpf.replace(
            /(\d{3})(\d)/,
            '$1.$2'
        );

    cpf =
        cpf.replace(
            /(\d{3})(\d)/,
            '$1.$2'
        );

    cpf =
        cpf.replace(
            /(\d{3})(\d{1,2})$/,
            '$1-$2'
        );

    return cpf;

}


/* =========================================================
   8. MÁSCARA DE TELEFONE
   ========================================================= */

function maskPhone(value) {

    let phone =
        digits(value)
            .slice(0, 11);

    if (phone.length <= 10) {

        return phone
            .replace(
                /^(\d{2})(\d)/,
                '($1) $2'
            )
            .replace(
                /(\d{4})(\d)/,
                '$1-$2'
            );

    }

    return phone
        .replace(
            /^(\d{2})(\d)/,
            '($1) $2'
        )
        .replace(
            /(\d{5})(\d)/,
            '$1-$2'
        );

}


/* =========================================================
   9. BADGE DE STATUS
   ========================================================= */

function statusBadge(status) {

    const value =
        String(status || '')
            .toLowerCase();

    let cssClass = 'red';

    if (
        value.includes('ativ') ||
        value.includes('public')
    ) {

        cssClass = 'green';

    }

    else if (
        value.includes('rascun') ||
        value.includes('pend')
    ) {

        cssClass = 'yellow';

    }

    return (
        `<span class="badge ${cssClass}">` +
        `${esc(status || '—')}` +
        `</span>`
    );

}


/* =========================================================
   10. LINKS SEGUROS
   ========================================================= */

function safeHref(url) {

    const value =
        String(url || '')
            .trim();

    if (!value) {

        return '';

    }

    if (
        /^https?:\/\//i.test(value) ||
        /^data:image\//i.test(value)
    ) {

        return value;

    }

    return '#';

}


/* =========================================================
   11. CONVERSÃO DE LINK DO YOUTUBE
   ========================================================= */

function youtubeEmbed(url) {

    const value =
        String(url || '')
            .trim();

    if (!value) {

        return '';

    }

    try {

        if (
            value.includes(
                'youtube.com/embed/'
            )
        ) {

            return safeHref(value);

        }

        const parsed =
            new URL(value);

        let videoId = '';

        if (
            parsed.hostname.includes(
                'youtu.be'
            )
        ) {

            videoId =
                parsed.pathname.slice(1);

        }

        else {

            videoId =
                parsed.searchParams.get('v') ||
                parsed.pathname
                    .split('/')
                    .filter(Boolean)
                    .pop();

        }

        if (!videoId) {

            return safeHref(value);

        }

        return (
            'https://www.youtube.com/embed/' +
            encodeURIComponent(videoId)
        );

    }

    catch {

        return safeHref(value);

    }

}


/* =========================================================
   12. PERFIL / TIPO DE USUÁRIO
   ========================================================= */

function userType(user) {

    return String(
        user?.tipo ||
        user?.role ||
        'Participante'
    ).toLowerCase();

}


function isAdminUser(user) {

    return (
        user?.role === 'admin' ||
        userType(user).includes('admin')
    );

}


/* =========================================================
   13. CONVERTER PROFILE DO SUPABASE
   =========================================================

   Estrutura real:

   profiles

   id
   cpf
   nome
   role
   status
   data JSONB
   created_at
   updated_at

   Os dados complementares ficam dentro de "data".
   ========================================================= */

function mapProfile(row) {

    if (!row) {

        return null;

    }

    const data =
        row.data || {};

    return {

        id:
            row.id,

        cpf:
            row.cpf || '',

        nome:
            row.nome || '',

        role:
            row.role || 'student',

        status:
            row.status || 'Ativo',

        tipo:
            data.tipo ||
            (
                row.role === 'admin'
                    ? 'Administrador'
                    : 'Participante'
            ),

        nascimento:
            data.nascimento || '',

        telefone:
            data.telefone || '',

        email:
            data.email || '',

        escola:
            data.escola || '',

        serie:
            data.serie || '',

        periodoEscolar:
            data.periodoEscolar || '',

        turmaEscolar:
            data.turmaEscolar || '',

        trabalha:
            data.trabalha || '',

        empresa:
            data.empresa || '',

        cargo:
            data.cargo || '',

        horarioTrabalho:
            data.horarioTrabalho || '',

        dataAdmissao:
            data.dataAdmissao || '',

        telefoneEmpresa:
            data.telefoneEmpresa || '',

        observacoes:
            data.observacoes || '',

        dataCadastro:
            row.created_at || '',

        updatedAt:
            row.updated_at || ''

    };

}


/* =========================================================
   14. CONVERTER CONTEÚDO
   ========================================================= */

function mapContent(row) {

    if (!row) {

        return null;

    }

    const data =
        row.data || {};

    return {

        id:
            row.id,

        tipoConteudo:
            row.tipo,

        status:
            row.status,

        turma:
            row.turma || '',

        ...data,

        dataCriacao:
            row.created_at

    };

}


/* =========================================================
   15. CONVERTER MATERIAL
   ========================================================= */

function mapMaterial(row) {

    if (!row) {

        return null;

    }

    const data =
        row.data || {};

    return {

        id:
            row.id,

        status:
            row.status,

        turma:
            row.turma || '',

        ...data,

        dataCriacao:
            row.created_at

    };

}


/* =========================================================
   16. CONVERTER AVISO
   ========================================================= */

function mapNotice(row) {

    if (!row) {

        return null;

    }

    const data =
        row.data || {};

    return {

        id:
            row.id,

        status:
            row.status,

        turma:
            row.turma || '',

        ...data,

        dataCriacao:
            row.created_at

    };

}


/* =========================================================
   17. CONVERTER RESULTADO
   ========================================================= */

function mapResult(row) {

    if (!row) {

        return null;

    }

    const data =
        row.data || {};

    return {

        id:
            row.id,

        usuarioId:
            row.user_id,

        atividadeId:
            row.content_id,

        ...data,

        dataConclusao:
            row.created_at

    };

}


/* =========================================================
   18. SESSÃO ATUAL
   ========================================================= */

function session() {

    return cache.session;

}


function currentUser() {

    const currentSession =
        session();

    if (!currentSession) {

        return null;

    }

    const user =
        cache.users.find(
            item =>
                String(item.id) ===
                String(
                    currentSession.userId
                )
        );

    if (user) {

        return user;

    }

    return {

        id:
            currentSession.userId,

        nome:
            currentSession.nome ||
            'Usuário',

        cpf:
            currentSession.cpf || '',

        role:
            currentSession.role,

        tipo:
            currentSession.role === 'admin'
                ? 'Administrador'
                : 'Participante'

    };

}


function settings() {

    return {

        ...defaultSettings,

        ...cache.settings

    };

}


/* =========================================================
   19. CARREGAR PERFIS
   ========================================================= */

async function loadProfiles() {

    const {
        data,
        error
    } =
        await supabase
            .from('profiles')
            .select('*')
            .order(
                'nome',
                {
                    ascending: true
                }
            );

    if (error) {

        console.error(
            'Erro ao carregar profiles:',
            error
        );

        throw error;

    }

    cache.users =
        (data || [])
            .map(mapProfile);

}


/* =========================================================
   20. CARREGAR CONTEÚDOS
   ========================================================= */

async function loadContents() {

    const {
        data,
        error
    } =
        await supabase
            .from('contents')
            .select('*')
            .order(
                'created_at',
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(
            'Erro ao carregar contents:',
            error
        );

        throw error;

    }

    cache.contents =
        (data || [])
            .map(mapContent);

}


/* =========================================================
   21. CARREGAR RESULTADOS
   ========================================================= */

async function loadResults() {

    const {
        data,
        error
    } =
        await supabase
            .from('results')
            .select('*')
            .order(
                'created_at',
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(
            'Erro ao carregar results:',
            error
        );

        throw error;

    }

    cache.results =
        (data || [])
            .map(mapResult);

}


/* =========================================================
   22. CARREGAR MATERIAIS
   ========================================================= */

async function loadMaterials() {

    const {
        data,
        error
    } =
        await supabase
            .from('materials')
            .select('*')
            .order(
                'created_at',
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(
            'Erro ao carregar materials:',
            error
        );

        throw error;

    }

    cache.materials =
        (data || [])
            .map(mapMaterial);

}


/* =========================================================
   23. CARREGAR AVISOS
   ========================================================= */

async function loadNotices() {

    const {
        data,
        error
    } =
        await supabase
            .from('notices')
            .select('*')
            .order(
                'created_at',
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(
            'Erro ao carregar notices:',
            error
        );

        throw error;

    }

    cache.notices =
        (data || [])
            .map(mapNotice);

}


/* =========================================================
   24. CARREGAR CONFIGURAÇÕES
   ========================================================= */

async function loadSettings() {

    const {
        data,
        error
    } =
        await supabase
            .from('app_settings')
            .select('*')
            .eq('id', 1)
            .maybeSingle();

    if (error) {

        console.error(
            'Erro ao carregar app_settings:',
            error
        );

        cache.settings = {
            ...defaultSettings
        };

        return;

    }

    cache.settings = {

        ...defaultSettings,

        ...(data?.data || {})

    };

}


/* =========================================================
   25. CARREGAR SESSÃO DO SUPABASE
   ========================================================= */

async function loadSession() {

    const {
        data,
        error
    } =
        await supabase
            .auth
            .getSession();

    if (error) {

        console.error(
            'Erro ao recuperar sessão:',
            error
        );

        cache.session = null;

        return null;

    }

    const authSession =
        data?.session;

    if (!authSession) {

        cache.session = null;

        return null;

    }

    const authUser =
        authSession.user;

    const {
        data: profileRow,
        error: profileError
    } =
        await supabase
            .from('profiles')
            .select('*')
            .eq(
                'id',
                authUser.id
            )
            .maybeSingle();

    if (profileError) {

        console.error(
            'Erro ao carregar perfil da sessão:',
            profileError
        );

        throw profileError;

    }

    if (!profileRow) {

        await supabase
            .auth
            .signOut();

        cache.session = null;

        throw new Error(
            'O usuário possui autenticação, mas não possui perfil cadastrado.'
        );

    }

    const profile =
        mapProfile(profileRow);

    const existingIndex =
        cache.users.findIndex(
            item =>
                String(item.id) ===
                String(profile.id)
        );

    if (existingIndex >= 0) {

        cache.users[existingIndex] =
            profile;

    }

    else {

        cache.users.push(
            profile
        );

    }

    cache.session = {

        userId:
            profile.id,

        nome:
            profile.nome,

        cpf:
            profile.cpf,

        role:
            profile.role === 'admin'
                ? 'admin'
                : 'student',

        loginAt:
            nowISO()

    };

    return cache.session;

}


/* =========================================================
   26. CARREGAMENTO GERAL
   ========================================================= */

async function loadAllData() {

    /*
       Primeiro recuperamos a sessão.

       Isso é importante porque as políticas RLS
       usam auth.uid().
    */

    await loadSession();

    /*
       Se não existe sessão, não tentamos consultar
       as tabelas protegidas.

       Isso também permite que as páginas de login
       funcionem normalmente.
    */

    if (!cache.session) {

        return;

    }

    await Promise.all([

        loadProfiles(),

        loadContents(),

        loadResults(),

        loadMaterials(),

        loadNotices(),

        loadSettings()

    ]);

}


/* =========================================================
   27. LOGIN POR CPF
   ========================================================= */

async function signInByCPF(
    cpf,
    password
) {

    const cleanCPF =
        digits(cpf);

    if (cleanCPF.length !== 11) {

        throw new Error(
            'Informe um CPF válido.'
        );

    }

    if (!password) {

        throw new Error(
            'Informe sua senha.'
        );

    }

    /*
       O usuário digita CPF.

       Internamente usamos o e-mail técnico:

       12345678900@coragem.local
    */

    const technicalEmail =
        `${cleanCPF}@coragem.local`;

    const {
        data,
        error
    } =
        await supabase
            .auth
            .signInWithPassword({

                email:
                    technicalEmail,

                password:
                    password

            });

    if (error) {

        throw new Error(
            'CPF ou senha incorretos.'
        );

    }

    if (!data?.user) {

        throw new Error(
            'Não foi possível identificar o usuário.'
        );

    }

    const {
        data: profileRow,
        error: profileError
    } =
        await supabase
            .from('profiles')
            .select('*')
            .eq(
                'id',
                data.user.id
            )
            .single();

    if (profileError) {

        await supabase
            .auth
            .signOut();

        throw new Error(
            'Não foi possível carregar o perfil deste usuário.'
        );

    }

    const profile =
        mapProfile(
            profileRow
        );

    if (
        String(
            profile.status || ''
        ).toLowerCase() ===
        'inativo'
    ) {

        await supabase
            .auth
            .signOut();

        throw new Error(
            'Este usuário está inativo.'
        );

    }

    return profile;

}


/* =========================================================
   28. LOGOUT
   ========================================================= */

async function logout() {

    const {
        error
    } =
        await supabase
            .auth
            .signOut();

    if (error) {

        console.error(
            'Erro no logout:',
            error
        );

    }

    cache.session = null;

    cache.users = [];

    cache.contents = [];

    cache.results = [];

    cache.materials = [];

    cache.notices = [];

    location.href =
        'index.html';

}


/* =========================================================
   29. ERROS DAS EDGE FUNCTIONS
   ========================================================= */

async function getFunctionErrorMessage(
    error
) {

    if (!error) {

        return (
            'Erro desconhecido na operação.'
        );

    }

    /*
       Quando uma Edge Function responde 400/401/403,
       o Supabase JS normalmente coloca a Response
       dentro de error.context.

       Aqui tentamos recuperar nosso:
       { ok:false, error:"..." }
    */

    try {

        const response =
            error.context;

        if (
            response &&
            typeof response.clone ===
            'function'
        ) {

            const cloned =
                response.clone();

            try {

                const body =
                    await cloned.json();

                if (body?.error) {

                    return body.error;

                }

                if (body?.message) {

                    return body.message;

                }

            }

            catch {

                /* tenta texto abaixo */

            }

        }

    }

    catch (contextError) {

        console.warn(
            'Não foi possível ler error.context:',
            contextError
        );

    }

    return (
        error.message ||
        'A Edge Function retornou um erro.'
    );

}


/* =========================================================
   30. CHAMAR ADMIN-USERS
   ========================================================= */

async function invokeAdminUsers(
    payload
) {

    const {
        data,
        error
    } =
        await supabase
            .functions
            .invoke(
                'admin-users',
                {
                    body:
                        payload
                }
            );

    if (error) {

        const message =
            await getFunctionErrorMessage(
                error
            );

        throw new Error(
            message
        );

    }

    if (
        data &&
        data.ok === false
    ) {

        throw new Error(
            data.error ||
            'A operação não pôde ser realizada.'
        );

    }

    return data;

}

/* =========================================================
   PROJETO CORAGEM
   CORE.JS — VERSÃO SUPABASE
   BLOCO 2/4
   ========================================================= */


/* =========================================================
   31. SIDEBAR
   ========================================================= */

function sidebar(role, page) {

    const admin = [

        [
            'pagina-adm.html',
            '🏠',
            'Dashboard',
            'dashboard'
        ],

        [
            'usuarios.html',
            '👥',
            'Usuários',
            'usuarios'
        ],

        [
            'atividades.html',
            '📝',
            'Atividades',
            'atividades'
        ],

        [
            'apostilas.html',
            '📖',
            'Apostilas',
            'apostilas'
        ],

        [
            'materiais.html',
            '📚',
            'Materiais',
            'materiais'
        ],

        [
            'ranking.html',
            '🏆',
            'Ranking',
            'ranking'
        ],

        [
            'relatorios.html',
            '📊',
            'Relatórios',
            'relatorios'
        ],

        [
            'avisos.html',
            '📢',
            'Avisos',
            'avisos'
        ],

        [
            'configuracoes.html',
            '⚙',
            'Configurações',
            'configuracoes'
        ]

    ];


    const student = [

        [
            'aluno.html',
            '🏠',
            'Início',
            'aluno'
        ],

        [
            'atividades-aluno.html',
            '📝',
            'Atividades',
            'atividades-aluno'
        ],

        [
            'apostilas-aluno.html',
            '📖',
            'Apostilas',
            'apostilas-aluno'
        ],

        [
            'materiais-aluno.html',
            '📚',
            'Materiais',
            'materiais-aluno'
        ],

        [
            'ranking-aluno.html',
            '🏆',
            'Ranking',
            'ranking-aluno'
        ],

        [
            'avisos-aluno.html',
            '📢',
            'Avisos',
            'avisos-aluno'
        ],

        [
            'perfil.html',
            '👤',
            'Meu perfil',
            'perfil'
        ]

    ];


    const items =
        role === 'admin'
            ? admin
            : student;


    return `

        <aside
            class="sidebar"
            id="sidebar"
        >

            <div class="side-brand">

                <img
                    src="assets/logo-projeto-coragem.png"
                    alt="Logo Projeto Coragem"
                >

                <div>

                    <strong>
                        PROJETO
                    </strong>

                    <span>
                        CORAGEM
                    </span>

                </div>

            </div>


            <div class="nav-section">

                ${
                    role === 'admin'
                        ? 'Administração'
                        : 'Área do aprendiz'
                }

            </div>


            <nav class="nav">

                ${
                    items
                        .map(item => {

                            return `

                                <a
                                    href="${item[0]}"
                                    class="${
                                        page === item[3]
                                            ? 'active'
                                            : ''
                                    }"
                                >

                                    <span>
                                        ${item[1]}
                                    </span>

                                    ${item[2]}

                                </a>

                            `;

                        })
                        .join('')
                }


                <a
                    href="#"
                    data-logout
                >

                    <span>
                        🚪
                    </span>

                    Sair

                </a>

            </nav>

        </aside>

    `;

}


/* =========================================================
   32. TOPBAR
   ========================================================= */

function topbar(role, title) {

    const user =
        currentUser();

    const name =
        user?.nome ||
        'Usuário';


    return `

        <header class="topbar">

            <div class="topbar-title">

                <button
                    class="btn btn-secondary btn-sm mobile-menu"
                    id="mobileMenu"
                    type="button"
                >
                    ☰
                </button>

                <h1>
                    ${esc(title)}
                </h1>

            </div>


            <div class="user-chip">

                <div class="avatar">

                    ${
                        esc(
                            name
                                .charAt(0)
                                .toUpperCase()
                        )
                    }

                </div>


                <span class="name">

                    ${esc(name)}

                </span>


                <span class="badge">

                    ${
                        role === 'admin'
                            ? 'Administrador'
                            : 'Aprendiz'
                    }

                </span>

            </div>

        </header>

    `;

}


/* =========================================================
   33. PROTEGER E MONTAR PÁGINAS
   ========================================================= */

async function mountShell() {

    const body =
        document.body;

    const role =
        body.dataset.role;

    const page =
        body.dataset.page;


    /*
       Página pública:
       login, por exemplo.
    */

    if (
        !role ||
        role === 'public'
    ) {

        return true;

    }


    const currentSession =
        session();


    /*
       Não existe sessão.
    */

    if (!currentSession) {

        location.href =
            role === 'admin'
                ? 'login-adm.html'
                : 'index.html';

        return false;

    }


    /*
       Página administrativa acessada
       por aluno.
    */

    if (
        role === 'admin' &&
        currentSession.role !== 'admin'
    ) {

        location.href =
            'aluno.html';

        return false;

    }


    /*
       Página de aluno acessada por ADM.
    */

    if (
        role === 'student' &&
        currentSession.role !== 'student'
    ) {

        location.href =
            'pagina-adm.html';

        return false;

    }


    const title =
        body.dataset.title ||
        'Projeto Coragem';


    const sidebarElement =
        document.getElementById(
            'shellSidebar'
        );


    const topbarElement =
        document.getElementById(
            'shellTopbar'
        );


    if (sidebarElement) {

        sidebarElement.innerHTML =
            sidebar(
                role,
                page
            );

    }


    if (topbarElement) {

        topbarElement.innerHTML =
            topbar(
                role,
                title
            );

    }


    /*
       Logout
    */

    document
        .querySelectorAll(
            '[data-logout]'
        )
        .forEach(element => {

            element.addEventListener(
                'click',
                async event => {

                    event.preventDefault();

                    await logout();

                }
            );

        });


    /*
       Menu mobile
    */

    document
        .getElementById(
            'mobileMenu'
        )
        ?.addEventListener(
            'click',
            () => {

                document
                    .getElementById(
                        'sidebar'
                    )
                    ?.classList
                    .toggle(
                        'open'
                    );

            }
        );


    return true;

}


/* =========================================================
   34. CABEÇALHO DAS PÁGINAS
   ========================================================= */

function pageHeader(
    title,
    description,
    actions = ''
) {

    return `

        <div class="page-head">

            <div>

                <div class="kicker">
                    Projeto Coragem
                </div>

                <h2>
                    ${esc(title)}
                </h2>

                <p>
                    ${esc(description)}
                </p>

            </div>


            <div class="actions">

                ${actions}

            </div>

        </div>

    `;

}


/* =========================================================
   35. CARDS DE MÉTRICAS
   ========================================================= */

function metric(
    label,
    value,
    trend
) {

    return `

        <div class="card metric">

            <div class="label">

                ${esc(label)}

            </div>


            <div class="value">

                ${value}

            </div>


            <div class="trend">

                ${esc(trend)}

            </div>

        </div>

    `;

}


/* =========================================================
   36. CARDS DE ATALHO
   ========================================================= */

function quick(
    icon,
    title,
    description,
    href
) {

    return `

        <a
            href="${href}"
            class="card hover"
            style="text-decoration:none"
        >

            <div
                style="font-size:2rem"
            >
                ${icon}
            </div>

            <h3>
                ${esc(title)}
            </h3>

            <p class="muted">

                ${esc(description)}

            </p>

        </a>

    `;

}


/* =========================================================
   37. LOGIN DO ALUNO
   ========================================================= */

function bindLogin() {

    const form =
        document.getElementById(
            'loginForm'
        );


    if (!form) {

        return;

    }


    const cpfInput =
        document.getElementById(
            'cpf'
        );


    if (cpfInput) {

        cpfInput.addEventListener(
            'input',
            event => {

                event.target.value =
                    maskCPF(
                        event.target.value
                    );

            }
        );

    }


    form.addEventListener(
        'submit',
        async event => {

            event.preventDefault();


            const button =
                form.querySelector(
                    'button[type="submit"]'
                );


            const oldText =
                button?.textContent;


            try {

                if (button) {

                    button.disabled = true;

                    button.textContent =
                        'Entrando...';

                }


                const profile =
                    await signInByCPF(
                        v('cpf'),
                        v('senha')
                    );


                /*
                   Um ADM não deve entrar
                   pela tela de aluno.
                */

                if (
                    profile.role === 'admin'
                ) {

                    await supabase
                        .auth
                        .signOut();

                    throw new Error(
                        'Utilize o acesso administrativo.'
                    );

                }


                location.href =
                    'aluno.html';

            }

            catch (error) {

                console.error(
                    'Erro no login:',
                    error
                );

                msg(
                    error.message ||
                    'Não foi possível entrar.',
                    'error'
                );

            }

            finally {

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        oldText;

                }

            }

        }
    );

}


/* =========================================================
   38. LOGIN DO ADMINISTRADOR
   ========================================================= */

function bindAdminLogin() {

    const form =
        document.getElementById(
            'adminLoginForm'
        );


    if (!form) {

        return;

    }


    const cpfInput =
        document.getElementById(
            'cpf'
        );


    if (cpfInput) {

        cpfInput.addEventListener(
            'input',
            event => {

                event.target.value =
                    maskCPF(
                        event.target.value
                    );

            }
        );

    }


    form.addEventListener(
        'submit',
        async event => {

            event.preventDefault();


            const button =
                form.querySelector(
                    'button[type="submit"]'
                );


            const oldText =
                button?.textContent;


            try {

                if (button) {

                    button.disabled =
                        true;

                    button.textContent =
                        'Entrando...';

                }


                const profile =
                    await signInByCPF(
                        v('cpf'),
                        v('senha')
                    );


                /*
                   Segurança adicional.

                   Mesmo que o login exista,
                   verificamos role.
                */

                if (
                    profile.role !== 'admin'
                ) {

                    await supabase
                        .auth
                        .signOut();

                    throw new Error(
                        'Este usuário não possui acesso administrativo.'
                    );

                }


                location.href =
                    'pagina-adm.html';

            }

            catch (error) {

                console.error(
                    'Erro no login ADM:',
                    error
                );

                msg(
                    error.message ||
                    'Não foi possível entrar.',
                    'error'
                );

            }

            finally {

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        oldText;

                }

            }

        }
    );

}


/* =========================================================
   39. TIPO DO CONTEÚDO
   ========================================================= */

function contentType(content) {

    return (
        content?.tipoConteudo ===
        'apostila'
    )
        ? 'apostila'
        : 'atividade';

}


/* =========================================================
   40. CONTEÚDO DISPONÍVEL PARA O ALUNO
   ========================================================= */

function publishedForUser(
    item,
    user
) {

    const published =
        String(
            item?.status || ''
        )
            .toLowerCase()
            .startsWith(
                'public'
            );


    if (!published) {

        return false;

    }


    const targetClass =
        String(
            item?.turma || ''
        )
            .trim()
            .toLowerCase();


    const userClass =
        String(
            user?.turmaEscolar ||
            user?.turma ||
            ''
        )
            .trim()
            .toLowerCase();


    /*
       Sem turma definida =
       disponível para todos.
    */

    if (!targetClass) {

        return true;

    }


    /*
       Se o aluno não tem turma,
       mantemos compatibilidade
       com o comportamento original.
    */

    if (!userClass) {

        return true;

    }


    return (
        targetClass ===
        userClass
    );

}


/* =========================================================
   41. MELHORES RESULTADOS
   ========================================================= */

function getResultsBest() {

    const best =
        new Map();


    cache.results
        .forEach(result => {

            const key =
                `${
                    result.usuarioId ||
                    result.usuarioNome
                }::${
                    result.atividadeId
                }`;


            const old =
                best.get(key);


            if (
                !old ||
                Number(
                    result.percentual
                ) >
                Number(
                    old.percentual
                )
            ) {

                best.set(
                    key,
                    result
                );

            }

        });


    return [
        ...best.values()
    ];

}


/* =========================================================
   42. CALCULAR RANKING
   ========================================================= */

function rankingData() {

    const config =
        settings();


    const map =
        new Map();


    cache.users
        .filter(
            user =>
                !isAdminUser(user)
        )
        .forEach(
            user => {

                map.set(
                    String(user.id),
                    {

                        userId:
                            String(
                                user.id
                            ),

                        nome:
                            user.nome,

                        turma:
                            user.turmaEscolar ||
                            '—',

                        concluidas:
                            0,

                        acertos:
                            0,

                        total:
                            0,

                        pontos:
                            0

                    }
                );

            }
        );


    getResultsBest()
        .forEach(
            result => {

                const id =
                    String(
                        result.usuarioId ||
                        ''
                    );


                if (!map.has(id)) {

                    map.set(
                        id,
                        {

                            userId:
                                id,

                            nome:
                                result.usuarioNome ||
                                'Participante',

                            turma:
                                result.turma ||
                                '—',

                            concluidas:
                                0,

                            acertos:
                                0,

                            total:
                                0,

                            pontos:
                                0

                        }
                    );

                }


                const item =
                    map.get(id);


                item.concluidas++;


                item.acertos +=
                    Number(
                        result.acertos ||
                        0
                    );


                item.total +=
                    Number(
                        result.totalQuestoes ||
                        0
                    );

            }
        );


    const ranking =
        [
            ...map.values()
        ]
            .map(
                item => {

                    const percentual =
                        item.total
                            ? Math.round(
                                item.acertos /
                                item.total *
                                100
                            )
                            : 0;


                    const pontos =

                        item.concluidas *
                        Number(
                            config.pointsComplete ||
                            100
                        )

                        +

                        item.acertos *
                        Number(
                            config.pointsCorrect ||
                            20
                        );


                    return {

                        ...item,

                        percentual,

                        pontos

                    };

                }
            );


    ranking.sort(
        (a, b) =>

            b.pontos -
            a.pontos

            ||

            b.percentual -
            a.percentual

            ||

            a.nome.localeCompare(
                b.nome
            )
    );


    return ranking;

}


/* =========================================================
   43. DASHBOARD DO ADMINISTRADOR
   ========================================================= */

function adminDashboard() {

    const root =
        document.getElementById(
            'adminDashboard'
        );


    if (!root) {

        return;

    }


    const users =
        cache.users
            .filter(
                user =>
                    !isAdminUser(user)
            );


    const activities =
        cache.contents
            .filter(
                content =>
                    contentType(content) ===
                    'atividade'
            );


    const books =
        cache.contents
            .filter(
                content =>
                    contentType(content) ===
                    'apostila'
            );


    const recent =
        [
            ...cache.contents
        ]
            .sort(
                (a, b) =>

                    new Date(
                        b.dataCriacao || 0
                    )

                    -

                    new Date(
                        a.dataCriacao || 0
                    )
            )
            .slice(
                0,
                6
            );


    root.innerHTML =

        pageHeader(

            'Painel administrativo',

            'Acompanhe os jovens aprendizes e gerencie o conteúdo da plataforma.',

            `

                <a
                    class="btn btn-primary"
                    href="novo-usuario.html"
                >
                    + Novo usuário
                </a>

                <a
                    class="btn btn-secondary"
                    href="nova-atividade.html"
                >
                    + Nova atividade
                </a>

            `

        )

        +

        `

        <div class="grid grid-4">

            ${
                metric(

                    'Usuários ativos',

                    users.filter(
                        user =>
                            String(
                                user.status
                            )
                                .toLowerCase() ===
                            'ativo'
                    ).length,

                    'participantes cadastrados'

                )
            }


            ${
                metric(

                    'Atividades',

                    activities.length,

                    'conteúdos avaliativos'

                )
            }


            ${
                metric(

                    'Apostilas',

                    books.length,

                    'conteúdos de estudo'

                )
            }


            ${
                metric(

                    'Conclusões',

                    cache.results.length,

                    'tentativas registradas'

                )
            }

        </div>


        <div class="section-title">

            <h3>
                Atalhos de gestão
            </h3>

        </div>


        <div class="grid grid-3">

            ${
                quick(

                    '👥',

                    'Gestão de usuários',

                    'Cadastre e acompanhe os participantes.',

                    'usuarios.html'

                )
            }


            ${
                quick(

                    '📚',

                    'Conteúdos formativos',

                    'Crie atividades e apostilas.',

                    'atividades.html'

                )
            }


            ${
                quick(

                    '📊',

                    'Acompanhamento',

                    'Veja ranking, resultados e relatórios.',

                    'relatorios.html'

                )
            }

        </div>


        <div class="section-title">

            <h3>
                Conteúdos recentes
            </h3>

        </div>


        <div class="table-wrap">

            <table>

                <thead>

                    <tr>

                        <th>
                            Título
                        </th>

                        <th>
                            Tipo
                        </th>

                        <th>
                            Tema
                        </th>

                        <th>
                            Turma
                        </th>

                        <th>
                            Status
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        recent.length

                            ?

                            recent
                                .map(
                                    content => `

                                        <tr>

                                            <td>

                                                <strong>

                                                    ${
                                                        esc(
                                                            content.titulo
                                                        )
                                                    }

                                                </strong>

                                            </td>


                                            <td>

                                                ${
                                                    contentType(
                                                        content
                                                    ) ===
                                                    'apostila'

                                                        ?

                                                        'Apostila'

                                                        :

                                                        'Atividade'
                                                }

                                            </td>


                                            <td>

                                                ${
                                                    esc(
                                                        content.tema ||
                                                        content.disciplina ||
                                                        '—'
                                                    )
                                                }

                                            </td>


                                            <td>

                                                ${
                                                    esc(
                                                        content.turma ||
                                                        'Todas'
                                                    )
                                                }

                                            </td>


                                            <td>

                                                ${
                                                    statusBadge(
                                                        content.status
                                                    )
                                                }

                                            </td>

                                        </tr>

                                    `
                                )
                                .join('')

                            :

                            `

                                <tr>

                                    <td
                                        colspan="5"
                                        class="empty"
                                    >

                                        Nenhum conteúdo cadastrado.

                                    </td>

                                </tr>

                            `
                    }

                </tbody>

            </table>

        </div>

        `;

}


/* =========================================================
   44. LISTAGEM DE USUÁRIOS
   ========================================================= */

function usersPage() {

    const root =
        document.getElementById(
            'usersPage'
        );


    if (!root) {

        return;

    }


    const users =
        cache.users
            .filter(
                user =>
                    !isAdminUser(user)
            );


    root.innerHTML =

        pageHeader(

            'Usuários',

            'Cadastre e acompanhe jovens aprendizes e demais participantes.',

            `

                <a
                    href="novo-usuario.html"
                    class="btn btn-primary"
                >

                    + Novo usuário

                </a>

            `

        )

        +

        `

        <div class="toolbar">

            <input
                id="searchUser"
                placeholder="Pesquisar nome, CPF, empresa ou turma"
            >


            <select id="filterStatus">

                <option value="">
                    Todos os status
                </option>

                <option value="Ativo">
                    Ativo
                </option>

                <option value="Inativo">
                    Inativo
                </option>

            </select>

            <div></div>

        </div>


        <div class="table-wrap">

            <table>

                <thead>

                    <tr>

                        <th>Nome</th>

                        <th>CPF</th>

                        <th>Turma</th>

                        <th>Empresa</th>

                        <th>Perfil</th>

                        <th>Status</th>

                        <th>Ações</th>

                    </tr>

                </thead>


                <tbody id="usersBody">
                </tbody>

            </table>

        </div>

        `;


    const render =
        () => {

            const search =
                (
                    document
                        .getElementById(
                            'searchUser'
                        )
                        ?.value ||
                    ''
                )
                    .toLowerCase();


            const status =
                document
                    .getElementById(
                        'filterStatus'
                    )
                    ?.value ||
                '';


            const filtered =
                users.filter(
                    user => {

                        const text =

                            `${user.nome} ` +

                            `${user.cpf} ` +

                            `${user.empresa || ''} ` +

                            `${user.turmaEscolar || ''}`;


                        const searchOk =

                            !search ||

                            text
                                .toLowerCase()
                                .includes(
                                    search
                                );


                        const statusOk =

                            !status ||

                            user.status ===
                            status;


                        return (
                            searchOk &&
                            statusOk
                        );

                    }
                );


            const body =
                document.getElementById(
                    'usersBody'
                );


            if (!body) {

                return;

            }


            body.innerHTML =

                filtered.length

                    ?

                    filtered
                        .map(
                            user => `

                                <tr>

                                    <td>

                                        <strong>

                                            ${
                                                esc(
                                                    user.nome
                                                )
                                            }

                                        </strong>


                                        ${
                                            user.email

                                                ?

                                                `

                                                    <div
                                                        class="muted small"
                                                    >

                                                        ${
                                                            esc(
                                                                user.email
                                                            )
                                                        }

                                                    </div>

                                                `

                                                :

                                                ''
                                        }

                                    </td>


                                    <td>

                                        ${
                                            esc(
                                                maskCPF(
                                                    user.cpf
                                                )
                                            )
                                        }

                                    </td>


                                    <td>

                                        ${
                                            esc(
                                                user.turmaEscolar ||
                                                '—'
                                            )
                                        }

                                    </td>


                                    <td>

                                        ${
                                            esc(
                                                user.empresa ||
                                                '—'
                                            )
                                        }

                                    </td>


                                    <td>

                                        ${
                                            esc(
                                                user.tipo ||
                                                'Participante'
                                            )
                                        }

                                    </td>


                                    <td>

                                        ${
                                            statusBadge(
                                                user.status
                                            )
                                        }

                                    </td>


                                    <td>

                                        <div class="actions">

                                            <a
                                                class="btn btn-secondary btn-sm"
                                                href="novo-usuario.html?id=${
                                                    encodeURIComponent(
                                                        user.id
                                                    )
                                                }"
                                            >

                                                Editar

                                            </a>


                                            <button
                                                class="btn btn-danger btn-sm"
                                                type="button"
                                                data-delete-user="${
                                                    esc(
                                                        user.id
                                                    )
                                                }"
                                            >

                                                Excluir

                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            `
                        )
                        .join('')

                    :

                    `

                        <tr>

                            <td
                                colspan="7"
                                class="empty"
                            >

                                Nenhum usuário encontrado.

                            </td>

                        </tr>

                    `;


            /*
               EXCLUSÃO
            */

            document
                .querySelectorAll(
                    '[data-delete-user]'
                )
                .forEach(
                    button => {

                        button.onclick =
                            async () => {

                                const userId =
                                    button.dataset.deleteUser;


                                const user =
                                    cache.users.find(
                                        item =>
                                            String(
                                                item.id
                                            ) ===
                                            String(
                                                userId
                                            )
                                    );


                                const confirmed =
                                    confirm(

                                        `Excluir ${
                                            user?.nome ||
                                            'este usuário'
                                        }?`

                                    );


                                if (!confirmed) {

                                    return;

                                }


                                button.disabled =
                                    true;


                                try {

                                    await invokeAdminUsers({

                                        action:
                                            'delete',

                                        id:
                                            userId

                                    });


                                    msg(
                                        'Usuário excluído com sucesso.'
                                    );


                                    cache.users =
                                        cache.users.filter(
                                            item =>
                                                String(
                                                    item.id
                                                ) !==
                                                String(
                                                    userId
                                                )
                                        );


                                    render();

                                }

                                catch (error) {

                                    console.error(
                                        'Erro ao excluir usuário:',
                                        error
                                    );


                                    msg(
                                        error.message ||
                                        'Não foi possível excluir o usuário.',
                                        'error'
                                    );


                                    button.disabled =
                                        false;

                                }

                            };

                    }
                );

        };


    document
        .getElementById(
            'searchUser'
        )
        ?.addEventListener(
            'input',
            render
        );


    document
        .getElementById(
            'filterStatus'
        )
        ?.addEventListener(
            'change',
            render
        );


    render();

}


/* =========================================================
   45. FORMULÁRIO DE USUÁRIO
   ========================================================= */

function userForm() {

    const form =
        document.getElementById(
            'userForm'
        );


    if (!form) {

        return;

    }


    const params =
        new URLSearchParams(
            location.search
        );


    const id =
        params.get('id');


    const editing =
        cache.users.find(
            user =>
                String(user.id) ===
                String(id)
        );


    const title =
        document.getElementById(
            'formTitle'
        );


    if (title) {

        title.textContent =
            editing
                ? 'Editar usuário'
                : 'Novo usuário';

    }


    /* =====================================================
       PREENCHER FORMULÁRIO NA EDIÇÃO
       ===================================================== */

    if (editing) {

        const fields = [

            'nome',

            'cpf',

            'nascimento',

            'telefone',

            'email',

            'tipo',

            'status',

            'escola',

            'serie',

            'periodoEscolar',

            'turmaEscolar',

            'trabalha',

            'empresa',

            'cargo',

            'horarioTrabalho',

            'dataAdmissao',

            'telefoneEmpresa',

            'observacoes'

        ];


        fields.forEach(
            field => {

                const element =
                    document.getElementById(
                        field
                    );


                if (!element) {

                    return;

                }


                let value =
                    editing[field] ??
                    '';


                if (
                    field === 'cpf'
                ) {

                    value =
                        maskCPF(
                            value
                        );

                }


                if (
                    field === 'telefone' ||
                    field ===
                    'telefoneEmpresa'
                ) {

                    value =
                        maskPhone(
                            value
                        );

                }


                element.value =
                    value;

            }
        );


        /*
           Na edição NÃO recuperamos senha.

           Senha nunca deve voltar
           do Supabase para o navegador.
        */

        const password =
            document.getElementById(
                'senha'
            );


        const confirmPassword =
            document.getElementById(
                'confirmarSenha'
            );


        if (password) {

            password.value = '';

            password.required =
                false;

            password.placeholder =
                'Deixe em branco para manter a senha atual';

        }


        if (confirmPassword) {

            confirmPassword.value = '';

            confirmPassword.required =
                false;

            confirmPassword.placeholder =
                'Repita somente se alterar a senha';

        }

    }


    /* =====================================================
       MÁSCARAS
       ===================================================== */

    document
        .getElementById(
            'cpf'
        )
        ?.addEventListener(
            'input',
            event => {

                event.target.value =
                    maskCPF(
                        event.target.value
                    );

            }
        );


    document
        .getElementById(
            'telefone'
        )
        ?.addEventListener(
            'input',
            event => {

                event.target.value =
                    maskPhone(
                        event.target.value
                    );

            }
        );


    document
        .getElementById(
            'telefoneEmpresa'
        )
        ?.addEventListener(
            'input',
            event => {

                event.target.value =
                    maskPhone(
                        event.target.value
                    );

            }
        );


    /* =====================================================
       SUBMIT

       IMPORTANTE:
       usamos form.onsubmit em vez de addEventListener.

       Isso ajuda a evitar dois listeners acidentais
       disparando dois POSTs para admin-users.
       ===================================================== */

    form.onsubmit =
        async event => {

            event.preventDefault();


            const submitButton =
                form.querySelector(
                    'button[type="submit"]'
                );


            const originalText =
                submitButton?.textContent;


            const password =
                v('senha');


            const confirmPassword =
                v('confirmarSenha');


            /* =================================================
               VALIDAÇÕES FRONTEND
               ================================================= */

            const cpf =
                digits(
                    v('cpf')
                );


            const nome =
                v('nome');


            if (
                cpf.length !== 11
            ) {

                msg(
                    'CPF inválido.',
                    'error'
                );

                return;

            }


            if (
                nome.length < 2
            ) {

                msg(
                    'Informe o nome do usuário.',
                    'error'
                );

                return;

            }


            /*
               Cadastro novo:
               senha obrigatória.
            */

            if (
                !editing &&
                password.length < 6
            ) {

                msg(
                    'A senha deve possuir pelo menos 6 caracteres.',
                    'error'
                );

                return;

            }


            /*
               Edição:
               se informou senha nova,
               ela precisa ter 6+.
            */

            if (
                editing &&
                password &&
                password.length < 6
            ) {

                msg(
                    'A nova senha deve possuir pelo menos 6 caracteres.',
                    'error'
                );

                return;

            }


            if (
                password !==
                confirmPassword
            ) {

                msg(
                    'As senhas não coincidem.',
                    'error'
                );

                return;

            }


            /* =================================================
               DADOS COMPLEMENTARES

               Estes campos pertencem ao JSONB "data"
               da tabela profiles.
               ================================================= */

            const profileData = {

                tipo:
                    v('tipo') ||
                    'Participante',

                nascimento:
                    v('nascimento'),

                telefone:
                    v('telefone'),

                email:
                    v('email'),

                escola:
                    v('escola'),

                serie:
                    v('serie'),

                periodoEscolar:
                    v('periodoEscolar'),

                turmaEscolar:
                    v('turmaEscolar'),

                trabalha:
                    v('trabalha'),

                empresa:
                    v('empresa'),

                cargo:
                    v('cargo'),

                horarioTrabalho:
                    v('horarioTrabalho'),

                dataAdmissao:
                    v('dataAdmissao'),

                telefoneEmpresa:
                    v('telefoneEmpresa'),

                observacoes:
                    v('observacoes')

            };


            /* =================================================
               PAYLOAD PARA EDGE FUNCTION
               ================================================= */

            const payload = {

                action:
                    editing
                        ? 'update'
                        : 'create',

                nome:
                    nome,

                cpf:
                    cpf,

                status:
                    v('status') ||
                    'Ativo',

                role:
                    'student',

                /*
                   Também enviamos tipo diretamente
                   para manter compatibilidade com
                   admin-users.
                */

                tipo:
                    profileData.tipo,

                data:
                    profileData

            };


            /*
               ID só existe na edição.
            */

            if (editing) {

                payload.id =
                    editing.id;

            }


            /*
               Só enviamos password
               quando existe uma senha.
            */

            if (password) {

                payload.password =
                    password;

                /*
                   Compatibilidade caso a função
                   ainda aceite "senha".
                */

                payload.senha =
                    password;

            }


            try {

                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        editing
                            ? 'Salvando...'
                            : 'Cadastrando...';

                }


                console.log(
                    'Enviando admin-users:',
                    {
                        ...payload,

                        /*
                           Nunca exibimos a senha
                           no console.
                        */

                        password:
                            payload.password
                                ? '[PROTEGIDA]'
                                : undefined,

                        senha:
                            payload.senha
                                ? '[PROTEGIDA]'
                                : undefined
                    }
                );


                const result =
                    await invokeAdminUsers(
                        payload
                    );


                console.log(
                    'Resposta admin-users:',
                    result
                );


                msg(

                    editing

                        ?

                        'Usuário atualizado com sucesso.'

                        :

                        'Usuário cadastrado com sucesso.'

                );


                /*
                   Atualizamos os perfis
                   diretamente do banco.
                */

                await loadProfiles();


                /*
                   Cadastro novo:
                   após pequeno intervalo,
                   voltamos à listagem.
                */

                if (!editing) {

                    setTimeout(
                        () => {

                            location.href =
                                'usuarios.html';

                        },
                        700
                    );

                }

            }

            catch (error) {

                console.error(
                    'Erro no cadastro de usuário:',
                    error
                );


                msg(
                    error.message ||
                    'Não foi possível salvar o usuário.',
                    'error'
                );

            }

            finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        originalText;

                }

            }

        };

}

/* =========================================================
   PROJETO CORAGEM
   CORE.JS — VERSÃO SUPABASE
   BLOCO 3/4
   ========================================================= */


/* =========================================================
   46. DASHBOARD DO ALUNO
   ========================================================= */

function studentDashboard() {

    const root =
        document.getElementById(
            'studentDashboard'
        );

    if (!root) {
        return;
    }

    const user =
        currentUser();

    if (!user) {
        return;
    }

    const contents =
        cache.contents.filter(
            content =>
                publishedForUser(
                    content,
                    user
                )
        );

    const results =
        cache.results.filter(
            result =>
                String(
                    result.usuarioId
                ) ===
                String(
                    user.id
                )
        );

    const completed =
        new Set(
            results.map(
                result =>
                    String(
                        result.atividadeId
                    )
            )
        );

    const pending =
        contents.filter(
            content =>
                !completed.has(
                    String(
                        content.id
                    )
                )
        );

    const ranking =
        rankingData();

    const position =
        ranking.findIndex(
            item =>
                String(
                    item.userId
                ) ===
                String(
                    user.id
                )
        ) + 1;

    root.innerHTML = `

        <div class="hero">

            <div class="card hero-main">

                <div class="kicker">

                    Olá,
                    ${
                        esc(
                            (
                                user.nome ||
                                'Aluno'
                            )
                            .split(' ')[0]
                        )
                    }

                </div>

                <h2>
                    Sua jornada de formação
                    continua aqui.
                </h2>

                <p>
                    Acompanhe suas atividades,
                    apostilas e materiais.
                </p>

                <div class="actions">

                    <a
                        class="btn btn-primary"
                        href="atividades-aluno.html"
                    >
                        Ver atividades
                    </a>

                    <a
                        class="btn btn-secondary"
                        href="apostilas-aluno.html"
                    >
                        Estudar apostilas
                    </a>

                </div>

            </div>


            <div class="card hero-side">

                <div>

                    <div class="muted small">
                        Seu progresso
                    </div>

                    <div
                        style="
                            font-size:3rem;
                            font-weight:900;
                            margin:8px 0;
                        "
                    >

                        ${completed.size}

                    </div>

                    <div class="muted">
                        conteúdos concluídos
                    </div>

                </div>


                <div>

                    ${
                        position > 0

                            ?

                            `
                            <span class="badge yellow">
                                🏆 ${position}º no ranking
                            </span>
                            `

                            :

                            `
                            <span class="badge">
                                Sem posição ainda
                            </span>
                            `
                    }

                </div>

            </div>

        </div>


        <div class="grid grid-3">

            ${
                metric(
                    'Disponíveis',
                    contents.length,
                    'conteúdos publicados'
                )
            }

            ${
                metric(
                    'Concluídos',
                    completed.size,
                    'atividades realizadas'
                )
            }

            ${
                metric(
                    'Pendentes',
                    pending.length,
                    'conteúdos para acessar'
                )
            }

        </div>

    `;

}


/* =========================================================
   47. CARD DE CONTEÚDO
   ========================================================= */

function courseCard(content) {

    const type =
        contentType(content);

    const questions =
        Array.isArray(
            content.questoes
        )
            ? content.questoes
            : [];

    return `

        <div class="card course-card hover">

            <div class="kicker">

                ${
                    type === 'apostila'
                        ? 'Apostila'
                        : 'Atividade'
                }

            </div>


            <h3>

                ${
                    esc(
                        content.titulo ||
                        'Conteúdo sem título'
                    )
                }

            </h3>


            <p>

                ${
                    esc(
                        content.descricao ||
                        content.introducao ||
                        'Conteúdo formativo do Projeto Coragem.'
                    )
                }

            </p>


            <div class="course-meta">

                <span class="badge">

                    ${
                        esc(
                            content.tema ||
                            content.disciplina ||
                            'Formação'
                        )
                    }

                </span>

            </div>


            <div class="bottom">

                <span class="muted small">

                    ${
                        questions.length
                    }
                    questão(ões)

                </span>


                <a
                    class="btn btn-primary btn-sm"
                    href="resolver.html?id=${
                        encodeURIComponent(
                            content.id
                        )
                    }"
                >

                    Abrir

                </a>

            </div>

        </div>

    `;

}


/* =========================================================
   48. LISTAR CONTEÚDOS PARA ALUNO
   ========================================================= */

function listStudentContents(type) {

    const root =
        document.getElementById(
            'studentContents'
        );

    if (!root) {
        return;
    }

    const user =
        currentUser();

    if (!user) {
        return;
    }

    const title =
        type === 'apostila'
            ? 'Apostilas'
            : 'Atividades';

    const description =
        type === 'apostila'

            ? 'Conteúdos de leitura e estudo disponíveis para sua formação.'

            : 'Atividades e avaliações disponíveis para você.';

    const contents =
        cache.contents.filter(
            content =>
                contentType(content) === type
                &&
                publishedForUser(
                    content,
                    user
                )
        );

    root.innerHTML =

        pageHeader(
            title,
            description
        )

        +

        `

        <div
            id="contentGrid"
            class="grid grid-3"
        >

            ${
                contents.length

                    ?

                    contents
                        .map(
                            courseCard
                        )
                        .join('')

                    :

                    `

                    <div class="card empty">

                        Nenhum conteúdo disponível
                        neste momento.

                    </div>

                    `
            }

        </div>

        `;

}


/* =========================================================
   49. LISTAR CONTEÚDOS PARA ADMIN
   ========================================================= */
function adminContentsPage(type) {

    const root = document.getElementById(
        type === 'apostila'
            ? 'apostilasPage'
            : 'atividadesPage'
    );

    if (!root) {
        return;
    }

    const title =
        type === 'apostila'
            ? 'Apostilas'
            : 'Atividades';

    const newPage =
        type === 'apostila'
            ? 'nova-apostila.html'
            : 'nova-atividade.html';


    // ============================================
    // RENDERIZAR A TABELA
    // ============================================

    const render = () => {

        const all = cache.contents.filter(
            content =>
                contentType(content) === type
        );


        root.innerHTML =

            pageHeader(

                title,

                'Gerencie os conteúdos da plataforma.',

                `
                <a
                    href="${newPage}"
                    class="btn btn-primary"
                >
                    + Nova ${
                        type === 'apostila'
                            ? 'apostila'
                            : 'atividade'
                    }
                </a>
                `

            )

            +

            `
            <div class="table-wrap">

                <table>

                    <thead>

                        <tr>

                            <th>Título</th>

                            <th>Tema/Área</th>

                            <th>Turma</th>

                            <th>Questões</th>

                            <th>Status</th>

                            <th>Ações</th>

                        </tr>

                    </thead>


                    <tbody>

                        ${
                            all.length

                                ?

                                all.map(
                                    content => `

                                    <tr>

                                        <td>

                                            <strong>
                                                ${
                                                    esc(
                                                        content.titulo
                                                    )
                                                }
                                            </strong>

                                        </td>


                                        <td>

                                            ${
                                                esc(
                                                    content.tema ||
                                                    content.disciplina ||
                                                    '—'
                                                )
                                            }

                                        </td>


                                        <td>

                                            ${
                                                esc(
                                                    content.turma ||
                                                    'Todas'
                                                )
                                            }

                                        </td>


                                        <td>

                                            ${
                                                Array.isArray(
                                                    content.questoes
                                                )
                                                    ? content.questoes.length
                                                    : 0
                                            }

                                        </td>


                                        <td>

                                            ${
                                                statusBadge(
                                                    content.status
                                                )
                                            }

                                        </td>


                                        <td>

                                            <a
    class="btn btn-secondary btn-sm"
    href="${
        type === 'apostila'
            ? 'nova-apostila.html'
            : 'nova-atividade.html'
    }?id=${
        encodeURIComponent(
            content.id
        )
    }"
>
    Editar
</a>

<button
    type="button"
    class="btn btn-danger btn-sm"
    data-delete-content="${
        esc(
            content.id
        )
    }"
>
    Excluir
</button>

                                        </td>

                                    </tr>

                                    `
                                ).join('')

                                :

                                `
                                <tr>

                                    <td
                                        colspan="6"
                                        class="empty"
                                    >
                                        Nenhum conteúdo cadastrado.
                                    </td>

                                </tr>
                                `
                        }

                    </tbody>

                </table>

            </div>
            `;


        // ============================================
        // BOTÃO EXCLUIR
        // ============================================

        document
            .querySelectorAll(
                '[data-delete-content]'
            )
            .forEach(
                button => {

                    button.onclick =
                        async () => {

                            const contentId =
                                button.dataset.deleteContent;


                            const content =
                                cache.contents.find(
                                    item =>
                                        String(item.id) ===
                                        String(contentId)
                                );


                            if (!content) {

                                msg(
                                    'Conteúdo não encontrado.',
                                    'error'
                                );

                                return;
                            }


                            // ====================================
                            // PROCURAR RESULTADOS DA ATIVIDADE
                            // ====================================

                            const relatedResults =
                                cache.results.filter(
                                    result =>
                                        String(
                                            result.atividadeId
                                        ) ===
                                        String(contentId)
                                );


                            let confirmationText =

                                `Deseja realmente excluir "${
                                    content.titulo ||
                                    'este conteúdo'
                                }"?`;


                            // Se houver respostas de alunos

                            if (relatedResults.length > 0) {

                                confirmationText =

                                    `ATENÇÃO!\n\n` +

                                    `"${content.titulo}" possui ` +

                                    `${relatedResults.length} resultado(s) ` +

                                    `registrado(s).\n\n` +

                                    `Ao excluir esta atividade, ` +

                                    `esses resultados também serão apagados ` +

                                    `e deixarão de contar no ranking.\n\n` +

                                    `Deseja continuar?`;

                            }


                            const confirmed =
                                confirm(
                                    confirmationText
                                );


                            if (!confirmed) {
                                return;
                            }


                            button.disabled = true;

                            const originalText =
                                button.textContent;

                            button.textContent =
                                'Excluindo...';


                            try {


                                // ====================================
                                // 1. EXCLUIR RESULTADOS VINCULADOS
                                // ====================================

                                if (relatedResults.length > 0) {

                                    const {
                                        error: resultsError
                                    } =
                                        await supabase
                                            .from('results')
                                            .delete()
                                            .eq(
                                                'content_id',
                                                contentId
                                            );


                                    if (resultsError) {

                                        throw new Error(
                                            'Erro ao excluir resultados: ' +
                                            resultsError.message
                                        );

                                    }

                                }


                                // ====================================
                                // 2. EXCLUIR ATIVIDADE/APOSTILA
                                // ====================================

                                const {
                                    error: contentError
                                } =
                                    await supabase
                                        .from('contents')
                                        .delete()
                                        .eq(
                                            'id',
                                            contentId
                                        );


                                if (contentError) {

                                    throw new Error(
                                        'Erro ao excluir conteúdo: ' +
                                        contentError.message
                                    );

                                }


                                // ====================================
                                // 3. ATUALIZAR CACHE
                                // ====================================

                                cache.contents =
                                    cache.contents.filter(
                                        item =>
                                            String(item.id) !==
                                            String(contentId)
                                    );


                                cache.results =
                                    cache.results.filter(
                                        result =>
                                            String(
                                                result.atividadeId
                                            ) !==
                                            String(contentId)
                                    );


                                // ====================================
                                // 4. MOSTRAR SUCESSO
                                // ====================================

                                msg(

                                    type === 'apostila'

                                        ? 'Apostila excluída com sucesso.'

                                        : 'Atividade excluída com sucesso.'

                                );


                                // Atualiza a tabela

                                render();

                            }


                            catch (error) {

                                console.error(
                                    'Erro ao excluir conteúdo:',
                                    error
                                );


                                msg(
                                    error.message ||
                                    'Não foi possível excluir o conteúdo.',
                                    'error'
                                );


                                button.disabled = false;

                                button.textContent =
                                    originalText;

                            }

                        };

                }

            );

    };


    render();

}

/* =========================================================
   50. CONTADOR DAS QUESTÕES
   ========================================================= */

let qCounter = 0;


/* =========================================================
   51. ADICIONAR QUESTÃO
   ========================================================= */

function addQuestion(
    targetId = 'questionsBuilder',
    type = 'multipla'
) {

    const wrapper =
        document.getElementById(
            targetId
        );

    if (!wrapper) {
        return;
    }

    qCounter++;

    const questionId =
        `q${qCounter}`;

    const div =
        document.createElement(
            'div'
        );

    div.className =
        'question-builder';

    div.dataset.qid =
        questionId;

    div.innerHTML = `

        <div class="question-top">

            <strong>
                Questão ${qCounter}
            </strong>

            <button
                type="button"
                class="btn btn-danger btn-sm"
                data-remove
            >
                Remover
            </button>

        </div>


        <div class="form-row">

            <div class="field">

                <label>
                    Tipo
                </label>

                <select class="q-type">

                    <option value="multipla">
                        Múltipla escolha
                    </option>

                    <option value="vf">
                        Verdadeiro ou falso
                    </option>

                    <option value="curta">
                        Resposta curta
                    </option>

                </select>

            </div>


            <div class="field">

                <label>
                    Valor
                </label>

                <input
                    class="q-value"
                    type="number"
                    min="1"
                    value="1"
                >

            </div>

        </div>


        <div class="field">

            <label>
                Enunciado
            </label>

            <textarea
                class="q-text"
                required
            ></textarea>

        </div>


        <div class="q-answer">
        </div>


        <div class="field">

            <label>
                Explicação após correção
            </label>

            <textarea
                class="q-explanation"
            ></textarea>

        </div>

    `;

    wrapper.appendChild(
        div
    );

    const select =
        div.querySelector(
            '.q-type'
        );

    select.value =
        type;

    select.addEventListener(
        'change',
        () => {

            renderQuestionAnswer(
                div
            );

        }
    );

    div
        .querySelector(
            '[data-remove]'
        )
        .addEventListener(
            'click',
            () => {

                div.remove();

            }
        );

    renderQuestionAnswer(
        div
    );

}


/* =========================================================
   52. CAMPO DE RESPOSTA DA QUESTÃO
   ========================================================= */

function renderQuestionAnswer(div) {

    const type =
        div
            .querySelector(
                '.q-type'
            )
            .value;

    const box =
        div.querySelector(
            '.q-answer'
        );

    if (!box) {
        return;
    }


    if (type === 'multipla') {

        box.innerHTML = `

            <label>
                Alternativas — marque a correta
            </label>


            <div class="option-grid">

                ${
                    [
                        'A',
                        'B',
                        'C',
                        'D'
                    ]
                    .map(
                        letter => `

                        <div class="option-line">

                            <input
                                type="radio"
                                name="${
                                    div.dataset.qid
                                }-correct"
                                value="${letter}"
                            >

                            <span>
                                ${letter}
                            </span>

                            <input
                                class="q-opt"
                                data-letter="${letter}"
                                placeholder="Alternativa ${letter}"
                            >

                        </div>

                        `
                    )
                    .join('')
                }

            </div>

        `;

        return;
    }


    if (type === 'vf') {

        box.innerHTML = `

            <div class="field">

                <label>
                    Resposta correta
                </label>

                <select class="q-correct">

                    <option value="">
                        Selecione
                    </option>

                    <option value="Verdadeiro">
                        Verdadeiro
                    </option>

                    <option value="Falso">
                        Falso
                    </option>

                </select>

            </div>

        `;

        return;
    }


    box.innerHTML = `

        <div class="field">

            <label>
                Resposta esperada
            </label>

            <input
                class="q-correct"
                placeholder="Digite a resposta correta"
            >

        </div>

    `;

}


/* =========================================================
   53. COLETAR QUESTÕES
   ========================================================= */

function collectQuestions() {

    const questions = [];

    const builders =
        document.querySelectorAll(
            '.question-builder'
        );


    for (
        const div
        of builders
    ) {

        const type =
            div
                .querySelector(
                    '.q-type'
                )
                ?.value ||
            'multipla';


        const text =
            div
                .querySelector(
                    '.q-text'
                )
                ?.value
                .trim() ||
            '';


        const explanation =
            div
                .querySelector(
                    '.q-explanation'
                )
                ?.value
                .trim() ||
            '';


        const value =
            Number(
                div
                    .querySelector(
                        '.q-value'
                    )
                    ?.value ||
                1
            );


        if (!text) {

            throw new Error(
                'Preencha o enunciado de todas as questões.'
            );

        }


        let alternatives = [];

        let correctAnswer = '';


        if (
            type ===
            'multipla'
        ) {

            alternatives =
                [
                    ...div.querySelectorAll(
                        '.q-opt'
                    )
                ]
                .map(
                    input => ({

                        letra:
                            input.dataset.letter,

                        texto:
                            input.value.trim()

                    })
                );


            const emptyAlternative =
                alternatives.some(
                    alternative =>
                        !alternative.texto
                );


            if (emptyAlternative) {

                throw new Error(
                    'Preencha todas as alternativas das questões de múltipla escolha.'
                );

            }


            correctAnswer =
                div.querySelector(
                    `input[name="${
                        div.dataset.qid
                    }-correct"]:checked`
                )
                ?.value ||
                '';

        }

        else {

            correctAnswer =
                div
                    .querySelector(
                        '.q-correct'
                    )
                    ?.value
                    .trim() ||
                '';

        }


        if (!correctAnswer) {

            throw new Error(
                'Informe a resposta correta de todas as questões.'
            );

        }


        questions.push({

            tipo:
                type,

            enunciado:
                text,

            alternativas:
                alternatives,

            respostaCorreta:
                correctAnswer,

            explicacao:
                explanation,

            valor:
                value

        });

    }


    if (!questions.length) {

        throw new Error(
            'Adicione pelo menos uma questão.'
        );

    }


    return questions;

}


/* =========================================================
   54. FORMULÁRIO DE NOVA ATIVIDADE
   ========================================================= */

function activityForm() {

    const form =
        document.getElementById(
            'activityForm'
        );

    if (!form) {
        return;
    }


    /*
       Coloca uma questão inicial
       somente se ainda não existir.
    */

    const builder =
        document.getElementById(
            'questionsBuilder'
        );

    if (
        builder &&
        !builder.children.length
    ) {

        addQuestion(
            'questionsBuilder',
            'multipla'
        );

    }


    document
        .getElementById(
            'addMultiple'
        )
        ?.addEventListener(
            'click',
            () => {

                addQuestion(
                    'questionsBuilder',
                    'multipla'
                );

            }
        );


    document
        .getElementById(
            'addVF'
        )
        ?.addEventListener(
            'click',
            () => {

                addQuestion(
                    'questionsBuilder',
                    'vf'
                );

            }
        );


    document
        .getElementById(
            'addShort'
        )
        ?.addEventListener(
            'click',
            () => {

                addQuestion(
                    'questionsBuilder',
                    'curta'
                );

            }
        );


    form.onsubmit =
        async event => {

            event.preventDefault();


            const button =
                form.querySelector(
                    'button[type="submit"]'
                );


            const originalText =
                button?.textContent;


            try {

                if (button) {

                    button.disabled =
                        true;

                    button.textContent =
                        'Salvando...';

                }


                const id =
                    uid('atividade');


                /*
                   A tabela contents possui:

                   id
                   tipo
                   status
                   turma
                   data
                   created_at

                   Portanto título, tema etc.
                   ficam no JSONB data.
                */

                const row = {

                    id:
                        id,

                    tipo:
                        'atividade',

                    status:
                        v('status') ||
                        'Rascunho',

                    turma:
                        v('turma'),

                    data: {

                        titulo:
                            v('titulo'),

                        tema:
                            v('tema'),

                        disciplina:
                            v('area'),

                        prazo:
                            v('prazo') ||
                            '',

                        descricao:
                            v('descricao'),

                        questoes:
                            collectQuestions()

                    }

                };


                if (!row.data.titulo) {

                    throw new Error(
                        'Informe o título da atividade.'
                    );

                }


                const {
                    error
                } =
                    await supabase
                        .from(
                            'contents'
                        )
                        .insert(
                            row
                        );


                if (error) {

                    throw error;

                }


                msg(
                    'Atividade salva com sucesso.'
                );


                form.reset();


                if (builder) {

                    builder.innerHTML =
                        '';

                    qCounter = 0;

                    addQuestion(
                        'questionsBuilder',
                        'multipla'
                    );

                }

            }

            catch (error) {

                console.error(
                    'Erro ao salvar atividade:',
                    error
                );


                msg(
                    error.message ||
                    'Não foi possível salvar a atividade.',
                    'error'
                );

            }

            finally {

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        originalText;

                }

            }

        };

}


/* =========================================================
   55. FORMULÁRIO DE NOVA APOSTILA
   ========================================================= */

function apostilaForm() {

    const form =
        document.getElementById(
            'apostilaForm'
        );

    if (!form) {
        return;
    }


    const builder =
        document.getElementById(
            'questionsBuilder'
        );


    if (
        builder &&
        !builder.children.length
    ) {

        addQuestion(
            'questionsBuilder',
            'multipla'
        );

    }


    document
        .getElementById(
            'addMultiple'
        )
        ?.addEventListener(
            'click',
            () => {

                addQuestion(
                    'questionsBuilder',
                    'multipla'
                );

            }
        );


    document
        .getElementById(
            'addVF'
        )
        ?.addEventListener(
            'click',
            () => {

                addQuestion(
                    'questionsBuilder',
                    'vf'
                );

            }
        );


    document
        .getElementById(
            'addShort'
        )
        ?.addEventListener(
            'click',
            () => {

                addQuestion(
                    'questionsBuilder',
                    'curta'
                );

            }
        );


    form.onsubmit =
        async event => {

            event.preventDefault();


            const button =
                form.querySelector(
                    'button[type="submit"]'
                );


            const originalText =
                button?.textContent;


            try {

                if (button) {

                    button.disabled =
                        true;

                    button.textContent =
                        'Salvando...';

                }


                const media = [];


                if (
                    v('imagemUrl')
                ) {

                    media.push({

                        tipo:
                            'imagem',

                        fonte:
                            safeHref(
                                v(
                                    'imagemUrl'
                                )
                            ),

                        legenda:
                            v(
                                'imagemLegenda'
                            )

                    });

                }


                if (
                    v('videoUrl')
                ) {

                    media.push({

                        tipo:
                            'video',

                        fonte:
                            youtubeEmbed(
                                v(
                                    'videoUrl'
                                )
                            ),

                        legenda:
                            v(
                                'videoLegenda'
                            )

                    });

                }


                const row = {

                    id:
                        uid(
                            'apostila'
                        ),

                    tipo:
                        'apostila',

                    status:
                        v('status') ||
                        'Rascunho',

                    turma:
                        v('turma'),

                    data: {

                        titulo:
                            v('titulo'),

                        tema:
                            v('tema'),

                        disciplina:
                            'Formação Profissional',

                        prazo:
                            v('prazo') ||
                            '',

                        introducao:
                            v('introducao'),

                        conteudo:
                            v('conteudo'),

                        reflexao:
                            v('reflexao'),

                        midias:
                            media,

                        questoes:
                            collectQuestions()

                    }

                };


                if (
                    !row.data.titulo
                ) {

                    throw new Error(
                        'Informe o título da apostila.'
                    );

                }


                const {
                    error
                } =
                    await supabase
                        .from(
                            'contents'
                        )
                        .insert(
                            row
                        );


                if (error) {

                    throw error;

                }


                msg(
                    'Apostila salva com sucesso.'
                );


                form.reset();


                if (builder) {

                    builder.innerHTML =
                        '';

                    qCounter = 0;

                    addQuestion(
                        'questionsBuilder',
                        'multipla'
                    );

                }

            }

            catch (error) {

                console.error(
                    'Erro ao salvar apostila:',
                    error
                );


                msg(
                    error.message ||
                    'Não foi possível salvar a apostila.',
                    'error'
                );

            }

            finally {

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        originalText;

                }

            }

        };

}


/* =========================================================
   56. CARD DE AVISO
   ========================================================= */

function noticeCard(notice) {

    return `

        <div class="card notice">

            <time>

                ${
                    fmtDate(
                        notice.dataCriacao,
                        true
                    )
                }

            </time>


            <h3>

                ${
                    esc(
                        notice.titulo ||
                        'Aviso'
                    )
                }

            </h3>


            <p>

                ${
                    esc(
                        notice.texto ||
                        ''
                    )
                }

            </p>


            ${
                notice.turma

                    ?

                    `

                    <span class="badge">

                        ${
                            esc(
                                notice.turma
                            )
                        }

                    </span>

                    `

                    :

                    ''
            }

        </div>

    `;

}


/* =========================================================
   57. MATERIAIS — ALUNO
   ========================================================= */

function materialsStudent() {

    const root =
        document.getElementById(
            'studentMaterials'
        );

    if (!root) {
        return;
    }


    const user =
        currentUser();


    const materials =
        cache.materials.filter(
            material =>
                publishedForUser(
                    material,
                    user
                )
        );


    root.innerHTML =

        pageHeader(

            'Materiais',

            'Recursos de apoio para estudo e formação profissional.'

        )

        +

        `

        <div class="grid grid-3">

            ${
                materials.length

                    ?

                    materials.map(
                        material => `

                        <div class="card course-card">

                            <div class="kicker">

                                ${
                                    esc(
                                        material.categoria ||
                                        'Material'
                                    )
                                }

                            </div>


                            <h3>

                                ${
                                    esc(
                                        material.titulo ||
                                        'Material'
                                    )
                                }

                            </h3>


                            <p>

                                ${
                                    esc(
                                        material.descricao ||
                                        ''
                                    )
                                }

                            </p>


                            ${
                                material.url

                                    ?

                                    `

                                    <a
                                        class="btn btn-primary btn-sm"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        href="${
                                            safeHref(
                                                material.url
                                            )
                                        }"
                                    >

                                        Abrir material

                                    </a>

                                    `

                                    :

                                    ''
                            }

                        </div>

                        `
                    ).join('')

                    :

                    `

                    <div class="card empty">

                        Nenhum material publicado.

                    </div>

                    `
            }

        </div>

        `;

}


/* =========================================================
   58. MATERIAIS — ADMIN
   ========================================================= */
function materialsAdmin() {

    const root =
        document.getElementById(
            'materialsPage'
        );

    if (!root) {
        return;
    }


    const render = () => {

        root.innerHTML =

            pageHeader(

                'Materiais',

                'Arquivos, links e conteúdos de apoio.',

                `
                <a
                    href="novo-material.html"
                    class="btn btn-primary"
                >
                    + Novo material
                </a>
                `

            )

            +

            `
            <div class="grid grid-3">

                ${
                    cache.materials.length

                        ?

                        cache.materials.map(
                            material => `

                            <div class="card">

                                <div class="kicker">

                                    ${
                                        esc(
                                            material.categoria ||
                                            'Material'
                                        )
                                    }

                                </div>


                                <h3>

                                    ${
                                        esc(
                                            material.titulo ||
                                            'Material'
                                        )
                                    }

                                </h3>


                                <p>

                                    ${
                                        esc(
                                            material.descricao ||
                                            ''
                                        )
                                    }

                                </p>


                                <div class="actions">

                                    ${
                                        statusBadge(
                                            material.status
                                        )
                                    }

                                </div>


                                <div
                                    class="actions"
                                    style="margin-top:15px"
                                >

                                    <a
                                        class="btn btn-secondary btn-sm"
                                        href="novo-material.html?id=${
                                            encodeURIComponent(
                                                material.id
                                            )
                                        }"
                                    >
                                        Editar
                                    </a>


                                    <button
                                        type="button"
                                        class="btn btn-danger btn-sm"
                                        data-delete-material="${
                                            esc(
                                                material.id
                                            )
                                        }"
                                    >
                                        Excluir
                                    </button>

                                </div>

                            </div>

                            `
                        ).join('')

                        :

                        `
                        <div class="card empty">

                            Nenhum material cadastrado.

                        </div>
                        `
                }

            </div>
            `;


        // ============================================
        // EXCLUIR MATERIAL
        // ============================================

        document
            .querySelectorAll(
                '[data-delete-material]'
            )
            .forEach(
                button => {

                    button.onclick =
                        async () => {

                            const materialId =
                                button.dataset.deleteMaterial;


                            const material =
                                cache.materials.find(
                                    item =>
                                        String(item.id) ===
                                        String(materialId)
                                );


                            if (!material) {

                                msg(
                                    'Material não encontrado.',
                                    'error'
                                );

                                return;
                            }


                            const confirmed =
                                confirm(
                                    `Deseja realmente excluir "${
                                        material.titulo ||
                                        'este material'
                                    }"?`
                                );


                            if (!confirmed) {
                                return;
                            }


                            button.disabled = true;

                            const originalText =
                                button.textContent;

                            button.textContent =
                                'Excluindo...';


                            try {

                                const {
                                    error
                                } =
                                    await supabase
                                        .from('materials')
                                        .delete()
                                        .eq(
                                            'id',
                                            materialId
                                        );


                                if (error) {
                                    throw error;
                                }


                                cache.materials =
                                    cache.materials.filter(
                                        item =>
                                            String(item.id) !==
                                            String(materialId)
                                    );


                                msg(
                                    'Material excluído com sucesso.'
                                );


                                render();

                            }

                            catch (error) {

                                console.error(
                                    'Erro ao excluir material:',
                                    error
                                );


                                msg(
                                    error.message ||
                                    'Não foi possível excluir o material.',
                                    'error'
                                );


                                button.disabled = false;

                                button.textContent =
                                    originalText;

                            }

                        };

                }

            );

    };


    render();

}

/* =========================================================
   59. FORMULÁRIO DE MATERIAL
   ========================================================= */

function materialForm() {
    const form = document.getElementById('materialForm');
    if (!form) return;

    const id = new URLSearchParams(location.search).get('id');
    const editing = id
        ? cache.materials.find(item => String(item.id) === String(id))
        : null;

    const button = form.querySelector('button[type="submit"]');

    if (id && !editing) {
        msg('Material não encontrado ou sem permissão.', 'error');
        if (button) button.disabled = true;
        return;
    }

    if (editing) {
        ['titulo', 'categoria', 'tipo', 'url',
         'descricao', 'turma', 'status'].forEach(field => {
            const input = document.getElementById(field);
            if (input) input.value = editing[field] ?? '';
        });

        const title = document.getElementById('formTitle');
        if (title) title.textContent = 'Editar material';

        if (button) button.textContent = 'Salvar alterações';
    }

    form.onsubmit = async event => {
        event.preventDefault();

        const originalText = button?.textContent;

        try {
            if (button) {
                button.disabled = true;
                button.textContent = 'Salvando...';
            }

            const row = {
                status: v('status') || 'Rascunho',
                turma: v('turma'),
                data: {
                    titulo: v('titulo'),
                    categoria: v('categoria'),
                    tipo: v('tipo'),
                    url: v('url'),
                    descricao: v('descricao')
                }
            };

            if (!row.data.titulo) {
                throw new Error('Informe o título do material.');
            }

            const query = editing
                ? supabase.from('materials')
                    .update(row)
                    .eq('id', editing.id)
                    .select('id')
                : supabase.from('materials')
                    .insert({ id: uid('material'), ...row })
                    .select('id');

            const { data, error } = await query;

            if (error) throw error;

            if (!data?.length) {
                throw new Error('O Supabase não confirmou a gravação.');
            }

            msg(editing
                ? 'Material atualizado com sucesso.'
                : 'Material criado com sucesso.');

            if (editing) {
                location.href = 'materiais.html';
            } else {
                form.reset();
            }

        } catch (error) {
            console.error('Erro ao salvar material:', error);
            msg(error.message || 'Erro ao salvar material.', 'error');
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
            }
        }
    };
}



/* =========================================================
   60. AVISOS — ALUNO
   ========================================================= */

function noticesStudent() {

    const root =
        document.getElementById(
            'studentNotices'
        );

    if (!root) {
        return;
    }


    const user =
        currentUser();


    const notices =
        cache.notices

            .filter(
                notice =>
                    publishedForUser(
                        notice,
                        user
                    )
            )

            .sort(
                (a, b) =>

                    new Date(
                        b.dataCriacao ||
                        0
                    )

                    -

                    new Date(
                        a.dataCriacao ||
                        0
                    )
            );


    root.innerHTML =

        pageHeader(

            'Avisos',

            'Comunicados importantes do Projeto Coragem.'

        )

        +

        `

        <div class="grid">

            ${
                notices.length

                    ?

                    notices
                        .map(
                            noticeCard
                        )
                        .join('')

                    :

                    `

                    <div class="card empty">

                        Nenhum aviso publicado.

                    </div>

                    `
            }

        </div>

        `;

}


/* =========================================================
   61. AVISOS — ADMIN
   ========================================================= */


function noticesAdmin() {
    const root = document.getElementById('noticesPage');
    if (!root) return;

    const render = () => {
        root.innerHTML =
            pageHeader(
                'Avisos',
                'Comunicados da plataforma.',
                `<a href="novo-aviso.html" class="btn btn-primary">
                    + Novo aviso
                </a>`
            ) +
            `<div class="grid grid-2">
                ${
                    cache.notices.length
                    ? cache.notices.map(notice => `
                        <div class="card notice">
                            <time>${fmtDate(notice.dataCriacao, true)}</time>
                            <h3>${esc(notice.titulo || 'Aviso')}</h3>
                            <p>${esc(notice.texto || '')}</p>

                            <div class="course-meta">
                                <span class="badge">
                                    ${esc(notice.turma || 'Todas as turmas')}
                                </span>
                                ${statusBadge(notice.status)}
                            </div>

                            <div class="actions" style="margin-top:15px">
                                <a
                                    class="btn btn-secondary btn-sm"
                                    href="novo-aviso.html?id=${encodeURIComponent(notice.id)}"
                                >
                                    Editar
                                </a>

                                <button
                                    type="button"
                                    class="btn btn-danger btn-sm"
                                    data-delete-notice="${esc(notice.id)}"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    `).join('')
                    : '<div class="card empty">Nenhum aviso cadastrado.</div>'
                }
            </div>`;

        root.querySelectorAll('[data-delete-notice]').forEach(button => {
            button.onclick = async () => {
                const id = button.dataset.deleteNotice;
                const notice = cache.notices.find(
                    item => String(item.id) === String(id)
                );

                if (!notice) return;

                if (!confirm(`Excluir o aviso "${notice.titulo}"?`)) {
                    return;
                }

                button.disabled = true;

                try {
                    const { data, error } = await supabase
                        .from('notices')
                        .delete()
                        .eq('id', id)
                        .select('id');

                    if (error) throw error;

                    if (!data?.length) {
                        throw new Error(
                            'Exclusão não confirmada pelo Supabase.'
                        );
                    }

                    cache.notices = cache.notices.filter(
                        item => String(item.id) !== String(id)
                    );

                    render();
                    msg('Aviso excluído com sucesso.');

                } catch (error) {
                    console.error('Erro ao excluir aviso:', error);
                    msg(error.message || 'Erro ao excluir aviso.', 'error');
                    button.disabled = false;
                }
            };
        });
    };

    render();
}


    

/* =========================================================
   62. FORMULÁRIO DE AVISO
   ========================================================= */

function noticeForm() {
    const form = document.getElementById('noticeForm');
    if (!form) return;

    const id = new URLSearchParams(location.search).get('id');

    const editing = id
        ? cache.notices.find(item => String(item.id) === String(id))
        : null;

    const button = form.querySelector('button[type="submit"]');

    if (id && !editing) {
        msg('Aviso não encontrado ou sem permissão.', 'error');
        if (button) button.disabled = true;
        return;
    }

    if (editing) {
        ['titulo', 'texto', 'turma', 'status'].forEach(field => {
            const input = document.getElementById(field);
            if (input) input.value = editing[field] ?? '';
        });

        const title = document.getElementById('formTitle');
        if (title) title.textContent = 'Editar aviso';

        if (button) button.textContent = 'Salvar alterações';
    }

    form.onsubmit = async event => {
        event.preventDefault();

        const originalText = button?.textContent;

        try {
            if (button) {
                button.disabled = true;
                button.textContent = 'Salvando...';
            }

            const row = {
                status: v('status') || 'Rascunho',
                turma: v('turma'),
                data: {
                    titulo: v('titulo'),
                    texto: v('texto')
                }
            };

            if (!row.data.titulo) {
                throw new Error('Informe o título do aviso.');
            }

            const query = editing
                ? supabase.from('notices')
                    .update(row)
                    .eq('id', editing.id)
                    .select('id')
                : supabase.from('notices')
                    .insert({ id: uid('aviso'), ...row })
                    .select('id');

            const { data, error } = await query;

            if (error) throw error;

            if (!data?.length) {
                throw new Error(
                    'O Supabase não confirmou a gravação.'
                );
            }

            msg(editing
                ? 'Aviso atualizado com sucesso.'
                : 'Aviso publicado com sucesso.');

            if (editing) {
                location.href = 'avisos.html';
            } else {
                form.reset();
            }

        } catch (error) {
            console.error('Erro ao salvar aviso:', error);
            msg(error.message || 'Erro ao salvar aviso.', 'error');
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
            }
        }
    };
}



/* =========================================================
   63. PERFIL DO ALUNO
   ========================================================= */

function studentProfile() {

    const root =
        document.getElementById(
            'studentProfile'
        );

    if (!root) {
        return;
    }


    const user =
        currentUser();


    if (!user) {
        return;
    }


    const rows = [

        [
            'Nome',
            user.nome
        ],

        [
            'CPF',
            maskCPF(
                user.cpf
            )
        ],

        [
            'E-mail',
            user.email
        ],

        [
            'Telefone',
            user.telefone
        ],

        [
            'Turma',
            user.turmaEscolar
        ],

        [
            'Escola',
            user.escola
        ],

        [
            'Série',
            user.serie
        ],

        [
            'Período escolar',
            user.periodoEscolar
        ],

        [
            'Empresa',
            user.empresa
        ],

        [
            'Cargo/Função',
            user.cargo
        ]

    ];


    root.innerHTML =

        pageHeader(

            'Meu perfil',

            'Confira os dados do seu cadastro.'

        )

        +

        `

        <div class="card">

            <div class="profile-list">

                ${
                    rows.map(
                        row => `

                        <div class="profile-item">

                            <small>

                                ${
                                    esc(
                                        row[0]
                                    )
                                }

                            </small>


                            <strong>

                                ${
                                    esc(
                                        row[1] ||
                                        'Não informado'
                                    )
                                }

                            </strong>

                        </div>

                        `
                    ).join('')
                }

            </div>

        </div>

        `;

}

/* =========================================================
   PROJETO CORAGEM
   CORE.JS — VERSÃO SUPABASE
   BLOCO 4/4
   ========================================================= */


/* =========================================================
   64. HTML DA RESPOSTA DE UMA QUESTÃO
   ========================================================= */

function answerHtml(question, index) {

    let input = '';

    if (
        question.tipo ===
        'multipla'
    ) {

        input =
            (
                question.alternativas ||
                []
            )
            .map(
                alternative => `

                    <label class="answer-option">

                        <input
                            type="radio"
                            name="ans${index}"
                            value="${
                                esc(
                                    alternative.letra
                                )
                            }"
                        >

                        <strong>
                            ${
                                esc(
                                    alternative.letra
                                )
                            })
                        </strong>

                        ${
                            esc(
                                alternative.texto
                            )
                        }

                    </label>

                `
            )
            .join('');

    }

    else if (
        question.tipo ===
        'vf'
    ) {

        input = `

            <label class="answer-option">

                <input
                    type="radio"
                    name="ans${index}"
                    value="Verdadeiro"
                >

                Verdadeiro

            </label>


            <label class="answer-option">

                <input
                    type="radio"
                    name="ans${index}"
                    value="Falso"
                >

                Falso

            </label>

        `;

    }

    else {

        input = `

            <div class="field">

                <input
                    name="ans${index}"
                    placeholder="Digite sua resposta"
                >

            </div>

        `;

    }


    return `

        <div class="question-builder">

            <strong>

                ${index + 1}.

                ${
                    esc(
                        question.enunciado
                    )
                }

            </strong>


            <div
                style="margin-top:12px"
            >

                ${input}

            </div>


            <div
                id="fb${index}"
            >
            </div>

        </div>

    `;

}


/* =========================================================
   65. MÍDIA DA APOSTILA
   ========================================================= */

function mediaHtml(media) {

    const source =
        safeHref(
            media.fonte
        );


    if (
        !source ||
        source === '#'
    ) {

        return '';

    }


    if (
        media.tipo ===
        'imagem'
    ) {

        return `

            <div class="media-box">

                <img
                    src="${esc(source)}"
                    alt="${
                        esc(
                            media.legenda ||
                            'Imagem'
                        )
                    }"
                >

                ${
                    media.legenda

                        ?

                        `

                        <div class="muted small">

                            ${
                                esc(
                                    media.legenda
                                )
                            }

                        </div>

                        `

                        :

                        ''
                }

            </div>

        `;

    }


    return `

        <div class="media-box">

            <iframe
                src="${esc(source)}"
                height="420"
                allowfullscreen
                loading="lazy"
            >
            </iframe>

            ${
                media.legenda

                    ?

                    `

                    <div class="muted small">

                        ${
                            esc(
                                media.legenda
                            )
                        }

                    </div>

                    `

                    :

                    ''
            }

        </div>

    `;

}


/* =========================================================
   66. PÁGINA DE RESOLUÇÃO
   ========================================================= */

function resolverPage() {

    const root =
        document.getElementById(
            'resolverPage'
        );


    if (!root) {

        return;

    }


    const params =
        new URLSearchParams(
            location.search
        );


    const id =
        params.get('id');


    const content =
        cache.contents.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!content) {

        root.innerHTML = `

            <div class="card empty">

                Conteúdo não encontrado.

            </div>

        `;

        return;

    }


    const currentSession =
        session();


    const admin =
        currentSession?.role ===
        'admin';


    const user =
        currentUser();


    const type =
        contentType(
            content
        );


    const questions =
        Array.isArray(
            content.questoes
        )
            ? content.questoes
            : [];


    const medias =
        Array.isArray(
            content.midias
        )
            ? content.midias
            : [];


    root.innerHTML =

        pageHeader(

            content.titulo ||
            'Conteúdo',

            content.descricao ||
            content.introducao ||
            ''

        )

        +

        `

        ${
            type === 'apostila'

                ?

                `

                <div class="card">

                    ${
                        content.introducao

                            ?

                            `

                            <h3>
                                Introdução
                            </h3>

                            <p>

                                ${
                                    esc(
                                        content.introducao
                                    )
                                }

                            </p>

                            `

                            :

                            ''
                    }


                    ${
                        content.conteudo

                            ?

                            `

                            <div
                                class="content-reader"
                                style="
                                    white-space:pre-wrap;
                                    line-height:1.7;
                                "
                            >

                                ${
                                    esc(
                                        content.conteudo
                                    )
                                }

                            </div>

                            `

                            :

                            ''
                    }


                    ${
                        medias
                            .map(
                                mediaHtml
                            )
                            .join('')
                    }


                    ${
                        content.reflexao

                            ?

                            `

                            <div
                                class="card"
                                style="
                                    margin-top:18px;
                                "
                            >

                                <div class="kicker">
                                    Para refletir
                                </div>

                                <p>

                                    ${
                                        esc(
                                            content.reflexao
                                        )
                                    }

                                </p>

                            </div>

                            `

                            :

                            ''
                    }

                </div>

                `

                :

                ''
        }


        <form
            id="answerForm"
            class="card"
            style="margin-top:18px"
        >

            <h3>
                Questões
            </h3>


            <div>

                ${
                    questions.length

                        ?

                        questions
                            .map(
                                answerHtml
                            )
                            .join('')

                        :

                        `

                        <div class="empty">

                            Este conteúdo não possui
                            questões cadastradas.

                        </div>

                        `
                }

            </div>


            ${
                questions.length

                    ?

                    `

                    <button
                        class="btn btn-primary"
                        type="submit"
                    >

                        Corrigir respostas

                    </button>

                    `

                    :

                    ''
            }


            <div
                id="answerResult"
                style="margin-top:16px"
            >
            </div>

        </form>

        `;


    const form =
        document.getElementById(
            'answerForm'
        );


    if (
        !form ||
        !questions.length
    ) {

        return;

    }


    form.onsubmit =
        async event => {

            event.preventDefault();


            const button =
                form.querySelector(
                    'button[type="submit"]'
                );


            const originalText =
                button?.textContent;


            try {

                if (button) {

                    button.disabled =
                        true;

                    button.textContent =
                        'Corrigindo...';

                }


                let correct =
                    0;


                let totalValue =
                    0;


                let achievedValue =
                    0;


                const answers =
                    [];


                questions.forEach(
                    (
                        question,
                        index
                    ) => {

                        const fields =
                            event.target
                                .querySelectorAll(
                                    `[name="ans${index}"]`
                                );


                        let answer =
                            '';


                        if (
                            question.tipo ===
                            'curta'
                        ) {

                            answer =
                                fields[0]
                                    ?.value
                                    ?.trim() ||
                                '';

                        }

                        else {

                            answer =
                                [
                                    ...fields
                                ]
                                .find(
                                    field =>
                                        field.checked
                                )
                                ?.value ||
                                '';

                        }


                        const isCorrect =

                            normalize(
                                answer
                            )

                            ===

                            normalize(
                                question.respostaCorreta
                            );


                        const questionValue =
                            Number(
                                question.valor ||
                                1
                            );


                        totalValue +=
                            questionValue;


                        if (isCorrect) {

                            correct++;

                            achievedValue +=
                                questionValue;

                        }


                        answers.push({

                            indice:
                                index,

                            resposta:
                                answer,

                            correta:
                                isCorrect

                        });


                        const feedback =
                            document.getElementById(
                                `fb${index}`
                            );


                        if (feedback) {

                            feedback.innerHTML = `

                                <div
                                    class="message ${
                                        isCorrect
                                            ? 'success'
                                            : 'error'
                                    }"
                                    style="
                                        display:block;
                                        margin-top:10px;
                                    "
                                >

                                    ${
                                        isCorrect

                                            ?

                                            '✓ Resposta correta.'

                                            :

                                            `✗ Resposta incorreta.`
                                    }


                                    ${
                                        !isCorrect

                                            ?

                                            `

                                            <div
                                                style="
                                                    margin-top:5px;
                                                "
                                            >

                                                Resposta correta:

                                                <strong>

                                                    ${
                                                        esc(
                                                            question.respostaCorreta
                                                        )
                                                    }

                                                </strong>

                                            </div>

                                            `

                                            :

                                            ''
                                    }


                                    ${
                                        question.explicacao

                                            ?

                                            `

                                            <div
                                                style="
                                                    margin-top:5px;
                                                "
                                            >

                                                ${
                                                    esc(
                                                        question.explicacao
                                                    )
                                                }

                                            </div>

                                            `

                                            :

                                            ''
                                    }

                                </div>

                            `;

                        }

                    }
                );


                const total =
                    questions.length;


                const percentage =

                    totalValue

                        ?

                        Math.round(
                            achievedValue /
                            totalValue *
                            100
                        )

                        :

                        0;


                const resultBox =
                    document.getElementById(
                        'answerResult'
                    );


                if (resultBox) {

                    resultBox.innerHTML = `

                        <div
                            class="message success"
                            style="display:block"
                        >

                            <strong>
                                Resultado:
                            </strong>

                            ${correct}
                            de
                            ${total}
                            questão(ões) correta(s).

                            <br>

                            Aproveitamento:

                            <strong>
                                ${percentage}%
                            </strong>

                        </div>

                    `;

                }


                /* =================================================
                   SALVAR RESULTADO

                   ADM pode testar atividade,
                   mas o teste do ADM não entra
                   no ranking.
                   ================================================= */

                if (
                    !admin &&
                    user
                ) {

                    const config =
                        settings();


                    const points =

                        Number(
                            config.pointsComplete ||
                            100
                        )

                        +

                        correct *
                        Number(
                            config.pointsCorrect ||
                            20
                        );


                    const resultRow = {

                        id:
                            uid(
                                'resultado'
                            ),

                        user_id:
                            user.id,

                        content_id:
                            content.id,

                        data: {

                            usuarioNome:
                                user.nome,

                            atividadeTitulo:
                                content.titulo,

                            tipoConteudo:
                                type,

                            turma:
                                user.turmaEscolar ||
                                '',

                            acertos:
                                correct,

                            totalQuestoes:
                                total,

                            percentual:
                                percentage,

                            pontos:
                                points,

                            respostas:
                                answers

                        }

                    };


                    const {
                        error
                    } =
                        await supabase
                            .from(
                                'results'
                            )
                            .insert(
                                resultRow
                            );


                    if (error) {

                        console.error(
                            'Erro ao salvar resultado:',
                            error
                        );


                        msg(
                            'A atividade foi corrigida, mas houve um erro ao registrar o resultado.',
                            'error'
                        );

                    }

                    else {

                        cache.results.unshift(
                            mapResult({
                                ...resultRow,
                                created_at:
                                    nowISO()
                            })
                        );

                    }

                }

            }

            catch (error) {

                console.error(
                    'Erro ao corrigir atividade:',
                    error
                );


                msg(
                    error.message ||
                    'Não foi possível corrigir a atividade.',
                    'error'
                );

            }

            finally {

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        originalText;

                }

            }

        };

}


/* =========================================================
   67. PÁGINA DE RANKING
   ========================================================= */

function rankPage(
    isStudent = false
) {

    const root =
        document.getElementById(

            isStudent

                ?

                'studentRanking'

                :

                'adminRanking'

        );


    if (!root) {

        return;

    }


    const config =
        settings();


    if (
        isStudent &&
        !config.showRanking
    ) {

        root.innerHTML =

            pageHeader(

                'Ranking',

                'Classificação dos participantes.'

            )

            +

            `

            <div class="card empty">

                O ranking está temporariamente
                desativado.

            </div>

            `;

        return;

    }


    const ranking =
        rankingData();


    root.innerHTML =

        pageHeader(

            'Ranking',

            'Pontuação baseada na participação e nos resultados.'

        )

        +

        `

        <div class="table-wrap">

            <table>

                <thead>

                    <tr>

                        <th>
                            Pos.
                        </th>

                        <th>
                            Participante
                        </th>

                        <th>
                            Turma
                        </th>

                        <th>
                            Concluídos
                        </th>

                        <th>
                            Aproveitamento
                        </th>

                        <th>
                            Pontos
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        ranking.length

                            ?

                            ranking.map(
                                (
                                    item,
                                    index
                                ) => `

                                <tr>

                                    <td>

                                        <strong>

                                            ${index + 1}º

                                        </strong>

                                    </td>


                                    <td>

                                        ${
                                            esc(
                                                item.nome
                                            )
                                        }

                                    </td>


                                    <td>

                                        ${
                                            esc(
                                                item.turma
                                            )
                                        }

                                    </td>


                                    <td>

                                        ${
                                            item.concluidas
                                        }

                                    </td>


                                    <td>

                                        ${
                                            item.percentual
                                        }%

                                    </td>


                                    <td>

                                        <strong>

                                            ${
                                                item.pontos
                                            }

                                        </strong>

                                    </td>

                                </tr>

                                `
                            ).join('')

                            :

                            `

                            <tr>

                                <td
                                    colspan="6"
                                    class="empty"
                                >

                                    Ainda não existem
                                    resultados registrados.

                                </td>

                            </tr>

                            `
                    }

                </tbody>

            </table>

        </div>

        `;

}


/* =========================================================
   68. DOWNLOAD DE CSV
   ========================================================= */

function downloadCSV(
    filename,
    rows
) {

    if (
        !Array.isArray(rows) ||
        !rows.length
    ) {

        alert(
            'Não existem dados para exportar.'
        );

        return;

    }


    const keys =
        Object.keys(
            rows[0]
        );


    const quote =
        value => {

            return (
                '"' +
                String(
                    value ?? ''
                )
                .replace(
                    /"/g,
                    '""'
                )
                +
                '"'
            );

        };


    const csv =

        '\ufeff'

        +

        [

            keys
                .map(
                    quote
                )
                .join(';'),

            ...rows.map(
                row =>

                    keys
                        .map(
                            key => {

                                let value =
                                    row[key];


                                if (
                                    typeof value ===
                                    'object'
                                    &&
                                    value !== null
                                ) {

                                    value =
                                        JSON.stringify(
                                            value
                                        );

                                }


                                return quote(
                                    value
                                );

                            }
                        )
                        .join(';')
            )

        ]
        .join('\n');


    const blob =
        new Blob(
            [csv],
            {
                type:
                    'text/csv;charset=utf-8;'
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const anchor =
        document.createElement(
            'a'
        );


    anchor.href =
        url;


    anchor.download =
        filename;


    document.body.appendChild(
        anchor
    );


    anchor.click();


    anchor.remove();


    URL.revokeObjectURL(
        url
    );

}


/* =========================================================
   69. RELATÓRIOS
   ========================================================= */

function reportsPage() {

    const root =
        document.getElementById(
            'reportsPage'
        );


    if (!root) {

        return;

    }


    const ranking =
        rankingData();


    const results =
        cache.results;


    const users =
        cache.users.filter(
            user =>
                !isAdminUser(
                    user
                )
        );


    const usersWithResults =
        ranking.filter(
            item =>
                item.concluidas >
                0
        ).length;


    const average =

        results.length

            ?

            Math.round(

                results.reduce(
                    (
                        total,
                        result
                    ) =>

                        total +
                        Number(
                            result.percentual ||
                            0
                        ),

                    0
                )

                /

                results.length

            )

            :

            0;


    root.innerHTML =

        pageHeader(

            'Relatórios',

            'Indicadores de participação e desempenho.',

            `

            <button
                id="exportResults"
                class="btn btn-primary"
                type="button"
            >
                Exportar resultados CSV
            </button>


            <button
                id="exportUsers"
                class="btn btn-secondary"
                type="button"
            >
                Exportar usuários CSV
            </button>

            `

        )

        +

        `

        <div class="grid grid-4">

            ${
                metric(
                    'Participantes',
                    users.length,
                    'cadastrados'
                )
            }


            ${
                metric(
                    'Tentativas',
                    results.length,
                    'resultados registrados'
                )
            }


            ${
                metric(
                    'Participantes ativos',
                    usersWithResults,
                    'com alguma conclusão'
                )
            }


            ${
                metric(
                    'Média geral',
                    `${average}%`,
                    'aproveitamento'
                )
            }

        </div>


        <div class="section-title">

            <h3>
                Desempenho por participante
            </h3>

        </div>


        <div class="table-wrap">

            <table>

                <thead>

                    <tr>

                        <th>
                            Participante
                        </th>

                        <th>
                            Turma
                        </th>

                        <th>
                            Conclusões
                        </th>

                        <th>
                            Aproveitamento
                        </th>

                        <th>
                            Pontos
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        ranking.length

                            ?

                            ranking.map(
                                item => `

                                <tr>

                                    <td>

                                        ${
                                            esc(
                                                item.nome
                                            )
                                        }

                                    </td>

                                    <td>

                                        ${
                                            esc(
                                                item.turma
                                            )
                                        }

                                    </td>

                                    <td>

                                        ${
                                            item.concluidas
                                        }

                                    </td>

                                    <td>

                                        ${
                                            item.percentual
                                        }%

                                    </td>

                                    <td>

                                        ${
                                            item.pontos
                                        }

                                    </td>

                                </tr>

                                `
                            ).join('')

                            :

                            `

                            <tr>

                                <td
                                    colspan="5"
                                    class="empty"
                                >

                                    Nenhum dado disponível.

                                </td>

                            </tr>

                            `
                    }

                </tbody>

            </table>

        </div>

        `;


    document
        .getElementById(
            'exportResults'
        )
        ?.addEventListener(
            'click',
            () => {

                const exportRows =
                    results.map(
                        result => ({

                            aluno:
                                result.usuarioNome ||
                                '',

                            atividade:
                                result.atividadeTitulo ||
                                '',

                            acertos:
                                result.acertos ||
                                0,

                            total:
                                result.totalQuestoes ||
                                0,

                            percentual:
                                result.percentual ||
                                0,

                            pontos:
                                result.pontos ||
                                0,

                            data:
                                fmtDate(
                                    result.dataConclusao,
                                    true
                                )

                        })
                    );


                downloadCSV(
                    'resultados-projeto-coragem.csv',
                    exportRows
                );

            }
        );


    document
        .getElementById(
            'exportUsers'
        )
        ?.addEventListener(
            'click',
            () => {

                const exportRows =
                    users.map(
                        user => ({

                            nome:
                                user.nome,

                            cpf:
                                user.cpf,

                            telefone:
                                user.telefone,

                            email:
                                user.email,

                            turma:
                                user.turmaEscolar,

                            escola:
                                user.escola,

                            empresa:
                                user.empresa,

                            cargo:
                                user.cargo,

                            status:
                                user.status

                        })
                    );


                downloadCSV(
                    'usuarios-projeto-coragem.csv',
                    exportRows
                );

            }
        );

}


/* =========================================================
   70. CONFIGURAÇÕES
   ========================================================= */

function settingsPage() {

    const form =
        document.getElementById(
            'settingsForm'
        );


    if (!form) {

        return;

    }


    const config =
        settings();


    const fields = [

        'institution',

        'tagline',

        'pointsComplete',

        'pointsCorrect'

    ];


    fields.forEach(
        field => {

            const element =
                document.getElementById(
                    field
                );


            if (element) {

                element.value =
                    config[field] ??
                    '';

            }

        }
    );


    const showRanking =
        document.getElementById(
            'showRanking'
        );


    const allowRetake =
        document.getElementById(
            'allowRetake'
        );


    if (showRanking) {

        showRanking.checked =
            !!config.showRanking;

    }


    if (allowRetake) {

        allowRetake.checked =
            !!config.allowRetake;

    }


    form.onsubmit =
        async event => {

            event.preventDefault();


            const button =
                form.querySelector(
                    'button[type="submit"]'
                );


            const originalText =
                button?.textContent;


            try {

                if (button) {

                    button.disabled =
                        true;

                    button.textContent =
                        'Salvando...';

                }


                const newSettings = {

                    institution:
                        v(
                            'institution'
                        ) ||
                        'Projeto Coragem',

                    tagline:
                        v(
                            'tagline'
                        ),

                    showRanking:
                        !!showRanking
                            ?.checked,

                    allowRetake:
                        !!allowRetake
                            ?.checked,

                    pointsComplete:
                        Number(
                            v(
                                'pointsComplete'
                            )
                        ) ||
                        100,

                    pointsCorrect:
                        Number(
                            v(
                                'pointsCorrect'
                            )
                        ) ||
                        20

                };


                /*
                   app_settings já possui
                   a linha id = 1.
                */

                const {
                    error
                } =
                    await supabase
                        .from(
                            'app_settings'
                        )
                        .update({

                            data:
                                newSettings,

                            updated_at:
                                nowISO()

                        })
                        .eq(
                            'id',
                            1
                        );


                if (error) {

                    throw error;

                }


                cache.settings = {

                    ...defaultSettings,

                    ...newSettings

                };


                msg(
                    'Configurações salvas com sucesso.'
                );

            }

            catch (error) {

                console.error(
                    'Erro ao salvar configurações:',
                    error
                );


                msg(
                    error.message ||
                    'Não foi possível salvar as configurações.',
                    'error'
                );

            }

            finally {

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        originalText;

                }

            }

        };

}


/* =========================================================
   71. DETECTAR MUDANÇAS DE AUTENTICAÇÃO
   ========================================================= */

supabase
    .auth
    .onAuthStateChange(
        (
            event,
            authSession
        ) => {

            console.log(
                'Supabase Auth:',
                event
            );


            if (
                event ===
                'SIGNED_OUT'
            ) {

                cache.session =
                    null;

            }


            /*
               Não fazemos redirecionamento
               automático aqui.

               Cada página é protegida
               por mountShell().
            */

        }
    );


/* =========================================================
   72. INICIALIZAÇÃO GERAL
   ========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        try {

            console.log(
                'Projeto Coragem iniciando...'
            );


            /* =============================================
               LOGIN

               Os formulários de login precisam ser
               registrados mesmo sem sessão.
               ============================================= */

            bindLogin();

            bindAdminLogin();


            /* =============================================
               CARREGAR SUPABASE
               ============================================= */

            await loadAllData();


            console.log(
                'Sessão carregada:',
                !!cache.session
            );


            /*
               Páginas privadas são protegidas
               aqui.
            */

            const mounted =
                await mountShell();


            if (!mounted) {

                return;

            }


            /* =============================================
               DASHBOARDS
               ============================================= */

            adminDashboard();

            studentDashboard();


            /* =============================================
               USUÁRIOS
               ============================================= */

            usersPage();

            userForm();


            /* =============================================
               CONTEÚDOS DO ADMIN
               ============================================= */

            adminContentsPage(
                'atividade'
            );

            adminContentsPage(
                'apostila'
            );


            /* =============================================
               CONTEÚDOS DO ALUNO
               ============================================= */

            const page =
                document.body
                    .dataset
                    .page;


            if (
                page ===
                'atividades-aluno'
            ) {

                listStudentContents(
                    'atividade'
                );

            }


            if (
                page ===
                'apostilas-aluno'
            ) {

                listStudentContents(
                    'apostila'
                );

            }


            /* =============================================
               FORMULÁRIOS DE CONTEÚDO
               ============================================= */

            activityForm();

            apostilaForm();


            /* =============================================
               MATERIAIS
               ============================================= */

            materialsAdmin();

            materialsStudent();

            materialForm();


            /* =============================================
               AVISOS
               ============================================= */

            noticesAdmin();

            noticesStudent();

            noticeForm();


            /* =============================================
               PERFIL
               ============================================= */

            studentProfile();


            /* =============================================
               RANKING
               ============================================= */

            rankPage(
                false
            );

            rankPage(
                true
            );


            /* =============================================
               RELATÓRIOS
               ============================================= */

            reportsPage();


            /* =============================================
               CONFIGURAÇÕES
               ============================================= */

            settingsPage();


            /* =============================================
               RESOLVER ATIVIDADE/APOSTILA
               ============================================= */

            resolverPage();


            console.log(
                'Projeto Coragem carregado com sucesso.'
            );

        }

        catch (error) {

            console.error(
                'ERRO NA INICIALIZAÇÃO:',
                error
            );


            msg(
                error.message ||
                'Não foi possível carregar a plataforma.',
                'error'
            );

        }

    }
);



})();