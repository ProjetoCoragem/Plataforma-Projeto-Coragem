# Plataforma Projeto Coragem — Protótipo funcional

Esta pasta contém uma versão completa, interligada e pronta para testes da plataforma voltada a **jovens aprendizes**.

## Como abrir
1. Abra `index.html` no Google Chrome ou Microsoft Edge.
2. Conta de demonstração do jovem:
   - CPF: `111.111.111-11`
   - Senha: `aprendiz123`
3. Acesso inicial do administrador:
   - CPF: `000.000.000-00`
   - Senha: `admin123`

Você pode alterar o acesso administrativo em **Configurações**.

## Páginas do jovem aprendiz
- Início
- Atividades
- Apostilas
- Materiais
- Ranking
- Avisos
- Meu perfil
- Resolução com correção automática

## Páginas administrativas
- Dashboard
- Usuários
- Novo/editar usuário
- Atividades / nova atividade
- Apostilas / nova apostila
- Materiais / novo material
- Ranking
- Relatórios + exportação CSV
- Avisos / novo aviso
- Configurações

## Armazenamento
Esta versão usa `localStorage`, portanto os dados ficam **somente no navegador/computador onde foram cadastrados**. Isso é ótimo para estudar a estrutura e testar a interface, mas ainda não é adequado para uso institucional real por vários computadores ao mesmo tempo.

Para uso real em rede/internet, o próximo passo é substituir o `localStorage` por:
- backend (Node.js/Express, Python/Flask/Django etc.);
- banco de dados (PostgreSQL/MySQL);
- autenticação segura com senhas criptografadas;
- hospedagem HTTPS;
- controle de permissões e backups.

## Estrutura
- `styles.css`: visual de toda a plataforma
- `core.js`: banco local, login, CRUD, ranking, relatórios e correção
- `assets/logo-projeto-coragem.png`: logo fornecida
- páginas `.html`: telas da plataforma

## Observação de segurança
As senhas deste protótipo são armazenadas no navegador sem criptografia. Use somente dados fictícios durante os testes.
