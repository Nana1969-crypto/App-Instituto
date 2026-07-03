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
- **Agenda**: calendário geral do instituto — datas de cursos, workshops, palestras,
  eventos e reuniões, cada um com sala/local (Salas 1 a 5, Auditório, Hall Superior e
  Hall de Entrada, com possibilidade de adicionar novas). Seletor de ano a partir de
  2025 — os próximos anos aparecem automaticamente. Aviso de conflito quando a mesma
  sala é reservada duas vezes no mesmo horário, resumo do uso das salas no ano e
  exportação da agenda em planilha.
- Cada curso tem uma **modalidade**: Curso, Workshop ou Palestra.
- **Alunos**: cadastro geral em ordem alfabética com busca — nome completo, nascimento,
  CPF, telefone, e-mail, endereço completo, responsável, encaminhamento, impacto das
  enchentes e situação social. A ficha de cada aluno mostra a trajetória: **quais cursos
  diferentes ele já fez no instituto**.
- **Professores**: nome, contato, formação e experiência profissional.
- **Chamada**: presença/falta por turma e data, com histórico editável e frequência
  individual calculada automaticamente.
- **Gráficos**: relatórios visuais (pizzas/roscas, barras e linha do tempo) em três
  seções — **Visão geral do instituto** (todas as áreas: pessoas por área, impacto
  das enchentes geral somando alunos + pacientes, encaminhamentos gerais),
  **Gratuidade** (pessoas atendidas sem custo, bolsistas, alunos e pacientes por
  condição, atendimentos gratuitos por especialidade) e **Cursos** (alunos por curso,
  situação das matrículas, presença por turma, evolução da frequência).
- **Relatórios**: presença por turma (com alerta abaixo de 75%), alunos multi-curso,
  combinações de cursos mais comuns, exportação em CSV (Excel) e impressão/PDF.
- **Atendimentos (módulo clínico)**: agenda de Psicologia, Psiquiatria e
  Neuropsicopedagogia com sub-áreas:
  - *Agenda*: atendimentos com data/hora, paciente, profissional, especialidade,
    tipo (primeira/retorno), formato (individual/grupo), modalidade
    (presencial/online) e status (agendado, confirmado, realizado, faltou, cancelado);
  - *Pacientes*: cadastro único com dados pessoais, sociais e **financeiros**
    (gratuito ou pago, cobrança mensal ou por consulta, valor);
  - *Profissionais*: especialidade, CRP/CRM/registro, dias e horários de atendimento;
  - *Relatórios*: gráficos por especialidade/status/profissional/modalidade,
    receita prevista no mês, pacientes pagantes, cruzamento de especialidades
    por paciente e exportação CSV.
  Novas especialidades podem ser adicionadas a qualquer momento (botão "+").
- **Minha área (área restrita do profissional)**: cada profissional entra com um
  PIN (definido pela secretaria no cadastro dele) e vê somente os próprios
  pacientes, agenda, valores e estatísticas — sem dados clínicos, que o sistema
  não armazena. *Atenção: é uma restrição organizacional; como os dados ficam no
  navegador, a proteção forte com login real virá na versão 2 (com servidor).*
  Nos dados de exemplo, o PIN dos três profissionais é `1234`.
- **Área do professor (cursos)**: mesmo esquema de PIN para os professores dos
  cursos (botão "Área do professor" na aba Professores): cada um vê apenas as
  próprias turmas, alunos (contato e frequência, sem dados sociais), alunos em
  risco e atalho para fazer a chamada. PIN de exemplo: `1234`.
- **Cursos gratuitos ou pagos, com bolsas**: cada curso pode ser marcado como
  gratuito ou pago (valor único ou mensal). Em cursos pagos, a matrícula tem a
  opção **bolsista** (isento). Os gráficos de gratuidade consideram alunos
  gratuitos + bolsistas + pacientes gratuitos.
- O cadastro de pacientes também pergunta **"Atingido pelas enchentes?"**, igual
  ao de alunos — os dois alimentam o gráfico geral de impacto das enchentes.

O campo **Encaminhamento** dos alunos já vem com as origens *Demanda espontânea, CRAS
e Escolas*, e é possível **adicionar novas origens** a qualquer momento (botão "+" ao
lado do campo). Há também o campo *Atingido pelas enchentes?* para o gráfico social.
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
