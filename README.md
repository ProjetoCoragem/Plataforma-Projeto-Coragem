# Plataforma Projeto Coragem + Supabase

Esta é a versão migrada do protótipo para **Supabase Auth + PostgreSQL**, mantendo a interface HTML/CSS/JS e as funcionalidades de usuários, atividades, apostilas, materiais, avisos, resultados, ranking, relatórios e configurações.

## 1. Criar o projeto Supabase
1. Crie um projeto no Supabase.
2. Abra **SQL Editor** e execute `supabase/schema.sql` inteiro.
3. Em **Authentication > Providers > Email**, mantenha Email habilitado e desative cadastro público de usuários. As contas serão criadas pela função administrativa.

## 2. Configurar o front-end
Abra `supabase-config.js` e preencha:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (ou a Publishable Key mostrada pelo projeto)

A chave `service_role` **nunca** deve ser colocada em HTML/JS do navegador.

## 3. Implantar as Edge Functions
Com a Supabase CLI autenticada e o projeto linkado:

```bash
supabase functions deploy admin-users
supabase functions deploy bootstrap-admin
supabase secrets set BOOTSTRAP_SECRET="ESCOLHA-UM-SEGREDO-FORTE"
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` ficam disponíveis às funções no ambiente Supabase.

## 4. Criar o primeiro administrador
1. Hospede/abra a aplicação por um servidor HTTP (não use `file://`).
2. Acesse `setup-admin.html`.
3. Informe nome, CPF, senha e o mesmo `BOOTSTRAP_SECRET` configurado acima.
4. Depois do sucesso, entre por `login-adm.html`.
5. **Remova `setup-admin.html` da hospedagem e apague/desative a função `bootstrap-admin`**. Ela existe apenas para a instalação inicial.

O login continua usando CPF. Internamente, o Auth usa um e-mail técnico derivado do CPF (`CPF@coragem.local`), que não aparece para o usuário. O e-mail real do jovem continua armazenado apenas no perfil.

## 5. Hospedagem
Use HTTPS em produção (Netlify, Vercel, GitHub Pages ou outro host estático). Para teste local, rode um servidor, por exemplo:

```bash
python -m http.server 8080
```

E abra `http://localhost:8080`.

## Segurança
- Senhas não ficam mais em `localStorage` nem nas tabelas da aplicação; ficam no Supabase Auth.
- RLS está habilitado nas tabelas.
- Alunos leem apenas o próprio perfil e os próprios resultados.
- Administração usa políticas próprias e a Edge Function para operações privilegiadas de contas.
- Nunca publique a `service_role`.

## Arquivos principais
- `core.js`: lógica da plataforma adaptada ao Supabase.
- `supabase-config.js`: URL e chave pública do projeto.
- `supabase/schema.sql`: tabelas, índices e políticas RLS.
- `supabase/functions/admin-users/index.ts`: criação/edição/exclusão segura de contas.
- `supabase/functions/bootstrap-admin/index.ts`: instalação do primeiro administrador.
