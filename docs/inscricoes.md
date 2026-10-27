# Inscrições do retiro — como funciona e o que configurar

## Onde editar o conteúdo
- `src/content/evento.ts`: datas, valores por faixa etária, textos, FAQ, programação, regras, contatos.
- `src/content/media.json`: fotos e vídeos do local (veja o cabeçalho de `src/landing/Gallery.tsx`).
- Nenhum componente precisa mudar para atualizar datas, valores ou programação.

## Fluxo
Navegador (responsável + integrantes) → `enviarInscricao` (função de servidor) → valida de novo, recalcula idade/valor → Google Apps Script → planilha.
O CPF e os demais dados nunca passam por URL, localStorage ou logs. A URL do script fica só no servidor.

## Configuração obrigatória (1 passo)
Defina `APPS_SCRIPT_URL` (e, opcionalmente, `APPS_SCRIPT_TOKEN`) no painel de variáveis/segredos da hospedagem.
Sem isso o formulário informa "inscrições temporariamente indisponíveis" e **não** finge sucesso.

## Formato enviado à planilha
JSON no corpo do POST (`text/plain`): dados da família + lista `participantes` (ver `CorpoPlanilha` em `src/lib/inscricao.ts`). O script antigo (1 pessoa por envio) NÃO serve mais: substitua pelo `Code.gs` de referência.
Resposta esperada: `{ "ok": true }`, ou `{ "ok": false, "code": "DUPLICATE" }` para CPF repetido.
Qualquer outra resposta (HTML de erro, timeout) é tratada como "não confirmado" — nunca como sucesso.
Se o seu script usa outros nomes de campos, ajuste só `montarRequisicao` em `src/api/sheets.server.ts`.
Referência pronta: `docs/apps-script/Code.gs` (grava uma linha por participante, de forma atômica, e recusa CPF repetido). Teste real: `node scripts/testar-planilha.mjs`.

## Testes automáticos
`npx tsx --test tests/*.test.ts` (regras de idade/valor/CPF e fluxo do servidor contra um mock local do Apps Script).

## Segurança das dependências (CVE-2026-102989)
`bun run build` executa antes `scripts/verificar-dependencias.mjs`, que bloqueia o build se
`@tanstack/react-start` < 1.168.60 ou `@tanstack/start-server-core` < 1.169.39 estiverem instalados.
Não use `DANGEROUSLY_DEPLOY_VULNERABLE_TANSTACK_START_XSS`.

## Modo de ensaio (pré-visualização)

O formulário tem 4 etapas (Responsável, Participantes, Transporte, Revisão). Em **Preview** da Vercel e no ambiente local
o envio roda em *modo de ensaio*: o servidor valida de novo e recalcula os valores, mas **não chama o Apps Script, não grava
na planilha e nunca mostra a tela de inscrição confirmada**. A página avisa isso em uma faixa. Só a produção da Vercel
(`VERCEL_ENV=production`) grava de verdade. Variável `FORM_MODO_ENSAIO`: `1` força ensaio, `0` libera gravação fora da produção.
