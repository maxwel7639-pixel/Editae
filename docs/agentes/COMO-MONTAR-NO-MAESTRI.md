# Como montar a obra do Editaê no Maestri

1. No Maestri, crie um workspace novo chamado **editae**.
2. **Diretório do workspace: `C:\Maxwel\editae`.**
3. Crie um terminal de agente (Claude Code) e troque o modelo para Opus: digite `/model` e escolha Opus.
4. Ligue o Maestro nesse terminal: ✏️ na barra → aba **Detalhes** → **Maestro** → Salvar.
5. Cole o comando central (está na conversa e abaixo).
6. Recrutas em Sonnet. A obra do Gatlo AI roda na mesma conta: um recruta por vez em cada obra.

Comando central:

> Você é o Maestro da obra do Editaê. A pasta é C:\Maxwel\editae. Leia, nesta ordem: docs/agentes/MAESTRO.md,
> README.md, docs/PLANO.md, docs/agentes/PONTOS.md e o plano do cérebro citado no MAESTRO.md. Siga o MAESTRO.md
> à risca: um ponto por vez, um recruta por ponto em floor próprio, recrutas em Sonnet, e você confere a prova
> antes de marcar no Registro. Comece pelo K1: antes de recrutar, me mostre em poucas linhas o que o K1 vai
> entregar e qual será a prova. Pontos com [OK do Maxwel] esperam meu "pode". Ninguém faz push na main nem
> merge. Nada em produção sem meu OK. Reporte curto e em português.
