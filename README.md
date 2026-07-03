# Painel de Cursos — Instituto Brasa Zona Norte

Sistema administrativo para gestão dos cursos do instituto: cadastro de cursos
(ementa, módulos, carga horária), turmas, professores, alunos, lista de chamada,
relatórios de presença e cruzamento de cursos por aluno.

**Versão 1** — aplicativo 100% no navegador, sem servidor. Os dados ficam salvos
no próprio navegador (localStorage) de quem usa.

## Funcionalidades

- **Painel**: alunos únicos, matrículas ativas, presença média, alunos por curso,
  situação das matrículas, trajetória entre cursos e alertas de baixa frequência.
- **Cursos**: os 5 cursos iniciais já vêm cadastrados (Empreendedorismo Resiliente,
  Gestão Financeira para Empreendedores, Social Media, Educação Financeira,
  Maquiagem Profissional) e é possível criar novos, com ementa, módulos e carga horária.
- **Turmas**: edições de cada curso, com professor, período, horário, local, vagas e status.
- **Alunos**: cadastro geral em ordem alfabética com busca — nome completo, nascimento,
  CPF, telefone, e-mail, endereço completo, responsável, encaminhamento, impacto das
  enchentes e situação social. A ficha de cada aluno mostra a trajetória: **quais cursos
  diferentes ele já fez no instituto**.
- **Professores**: nome, contato, formação e experiência profissional.
- **Chamada**: presença/falta por turma e data, com histórico editável e frequência
  individual calculada automaticamente.
- **Relatórios**: presença por turma (com alerta abaixo de 75%), alunos multi-curso,
  combinações de cursos mais comuns, exportação em CSV (Excel) e impressão/PDF.
- **Backup**: exportação e importação de todos os dados em arquivo `.json`.

Na primeira visita, o botão **“Carregar dados de exemplo”** no Painel preenche o
sistema com dados fictícios para conhecer as telas. Para começar de verdade, use
**Relatórios → Apagar todos os dados**.

## Como usar localmente

Basta abrir o `index.html` em um navegador — não precisa instalar nada.

## Como publicar no Cloudflare Pages (grátis)

1. Crie uma conta gratuita em [dash.cloudflare.com](https://dash.cloudflare.com).
2. No menu, vá em **Workers & Pages → Create → Pages → Connect to Git**.
3. Autorize o GitHub e escolha este repositório (`app-instituto`).
4. Em *Build settings*, deixe tudo em branco (não há build) e clique em **Save and Deploy**.
5. Em ~1 minuto o painel estará no ar em uma URL do tipo `https://app-instituto.pages.dev`.

A cada novo commit neste repositório, o Cloudflare republica automaticamente.

## Avisos importantes

- **Dados por navegador**: nesta versão, cada computador/celular tem seus próprios
  dados. Para uso em equipe com dados compartilhados e login, a versão 2 usará um
  banco de dados (Cloudflare D1) — a estrutura do código já foi pensada para essa migração.
- **LGPD**: o sistema guarda dados pessoais sensíveis (CPF, endereço, situação social).
  Exporte backups com frequência, guarde-os em local seguro e restrinja o acesso ao
  computador onde o sistema é usado.

## Estrutura do código

```
index.html          — página única do aplicativo
css/style.css       — design system (tema claro/escuro, cores por curso)
js/util.js          — utilitários
js/store.js         — camada de dados (localStorage) e regras de negócio
js/app.js           — roteador e modal
js/views/*.js       — uma tela por arquivo
```
