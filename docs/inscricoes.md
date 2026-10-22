# Inscrições do retiro — como funciona e o que configurar

## Onde editar o conteúdo
- `src/content/evento.ts`: datas, valores por faixa etária, textos, FAQ, programação, regras, contatos.
- `src/content/media.json`: fotos e vídeos do local (veja o cabeçalho de `src/landing/Gallery.tsx`).
- Nenhum componente precisa mudar para atualizar datas, valores ou programação.

## Fluxo
Navegador → `enviarInscricao` (função de servidor) → valida de novo, recalcula idade/valor → Google Apps Script → planilha.
O CPF e os demais dados nunca passam por URL, localStorage ou logs. A URL do script fica só no servidor.

## Configuração obrigatória (1 passo)
Defina `APPS_SCRIPT_URL` (e, opcionalmente, `APPS_SCRIPT_TOKEN`) no painel de variáveis/segredos da hospedagem.
Sem isso o formulário informa "inscrições temporariamente indisponíveis" e **não** finge sucesso.

## Formato enviado à planilha
JSON no corpo do POST (`text/plain`), com os campos de `CorpoPlanilha` em `src/lib/inscricao.ts`.
Resposta esperada: `{ "ok": true }`, ou `{ "ok": false, "code": "DUPLICATE" }` para CPF repetido.
Qualquer outra resposta (HTML de erro, timeout) é tratada como "não confirmado" — nunca como sucesso.
Se o seu script usa outros nomes de campos, ajuste só `montarRequisicao` em `src/server/sheets.server.ts`.
Referência pronta: `docs/apps-script/Code.gs`. Teste real: `node scripts/testar-planilha.mjs`.

## Testes automáticos
`npx tsx --test tests/*.test.ts` (regras de idade/valor/CPF e fluxo do servidor contra um mock local do Apps Script).
