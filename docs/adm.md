# Sistema de gestão (/adm)

Tela de gestão do retiro (inscritos, pagamentos, despesas, doações, ajustes, camisetas e relatórios).
A planilha Google é a **única base de dados**; o /adm lê e grava nela pelo mesmo Apps Script do site.

## Como funciona
- **Produção** (`VERCEL_ENV=production`): login real. Preview/local: prévia com dados fictícios (nada grava).
- **Login:** e-mail do cadastro + 4 primeiros dígitos do CPF da própria linha, só para linhas da aba
  *Inscrições* com `acesso_sistema = sim`. A conferência acontece no Apps Script (CPF nunca vai ao navegador).
  5 erros seguidos bloqueiam aquele e-mail por 15 minutos. A sessão é um cookie assinado de 8 horas.
- **Abas:** Inscrições (só o site grava), Pagamentos, Despesas, Doações, Ajustes, Extras (camisetas) e Histórico
  (quem fez o quê). Pagamentos nunca são editados: erro = estorno (valor negativo).
- **Parcelas Pix:** 25/11/2026, 05/12/2026, 25/12/2026, 25/01/2027, iguais entre si (`src/adm/calculos.ts`).

## Preparar (uma vez)
1. Apps Script: cole `docs/apps-script/Code.gs`, salve.
2. Propriedades do script: `TOKEN` (site, já existe) e `ADM_TOKEN` (novo).
3. Execute a função `prepararPlanilha` (cria abas e a coluna `acesso_sistema`).
4. Implantar → Gerenciar implantações → editar → **Nova versão**.
5. Na aba Inscrições, escreva `sim` em `acesso_sistema` só nas linhas da equipe.
6. Vercel (Production): `ADM_TOKEN` e `ADM_SESSION_SECRET`. Redeploy.

## Código
`src/adm/` (tipos, cálculos, interface), `src/api/adm.server.ts` (regras e validação),
`src/api/adm.functions.ts` (endpoints), `tests/adm*.test.ts`, `tests/apps-script.test.ts` (testa o Code.gs).
