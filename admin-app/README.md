# Aplicação independente de gestão do Retiro

Este subprojeto contém somente o sistema administrativo. A landing pública e o Apps Script público de inscrições não são importados nem modificados por ele.

## Estrutura

- `admin-app/` é a raiz do projeto Vercel administrativo.
- A aplicação atende `/adm` e sua API própria em `/adm/api`.
- `admin-app/apps-script/Code.gs` é um Apps Script separado, que acessa a mesma planilha pelo ID.
- `../vercel.json` faz proxy somente dos caminhos `/adm` para o projeto Vercel administrativo. O restante do site continua no projeto atual.

## Vercel

1. Criar um segundo projeto a partir do mesmo repositório, com nome `retiro2027-admin` e **Root Directory** `admin-app`.
2. O alias esperado para o novo projeto é `https://retiro2027-admin.vercel.app`. Se a Vercel atribuir outro alias, ajustar apenas o destino `https://...` das duas regras `/adm` em `../vercel.json`.
3. Configurar, somente no projeto `retiro2027-admin`, as variáveis de produção:
   - `ADM_APPS_SCRIPT_URL`: URL `/exec` do Apps Script administrativo.
   - `ADM_TOKEN`: token compartilhado com as propriedades do Apps Script administrativo.
   - `ADM_SESSION_SECRET`: segredo aleatório com pelo menos 32 caracteres.
4. Criar um novo deploy desse projeto. O deploy público do site principal continua pertencendo ao projeto `retiro2027`.

## Planilha e Apps Script

1. Criar um projeto Apps Script independente e colar `admin-app/apps-script/Code.gs`.
2. Em Propriedades do script, preencher `SPREADSHEET_ID` com o ID da planilha correta e `ADM_TOKEN` com o mesmo segredo definido no projeto Vercel administrativo.
3. Executar `prepararPlanilha` e autorizar o script. Ele cria abas financeiras separadas e acrescenta somente `acesso_sistema` e `statusInterno` à aba `Inscrições`; não substitui nem chama o Apps Script público.
4. Implantar como App da Web (executar como o proprietário; acesso para qualquer pessoa) e copiar a URL `/exec` para `ADM_APPS_SCRIPT_URL` no projeto administrativo.
5. Na coluna `acesso_sistema`, marcar `sim` apenas para pessoas autorizadas.

## Segurança e comportamento

- Fora de produção, o painel usa dados fictícios e não grava na planilha.
- Em produção, login exige e-mail cadastrado, os quatro primeiros dígitos do CPF e `acesso_sistema = sim`.
- O painel nunca recebe CPF na resposta de leitura. Pagamentos, despesas, doações, ajustes e camisetas ficam em abas do próprio sistema.
- Os seis status de organização ficam na coluna interna `statusInterno`, não são exibidos no formulário público.
- As gravações financeiras validam os cabeçalhos antes de escrever; cabeçalhos incompatíveis interrompem a operação.

## Desenvolvimento local

Dentro de `admin-app`, usar `bun install`, `bun run dev`, `bun run build` e `bun run preview`.