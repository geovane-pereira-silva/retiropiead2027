# Fotos e vídeo do retiro

Só entram fotos reais e autorizadas. O que ainda não foi cadastrado aparece na página como
**espaço reservado identificado** (borda tracejada amarela com o nome do arquivo esperado) e some
sozinho quando o arquivo é cadastrado.

1. Copie os arquivos para `public/midia/`. Prefira nomes sem espaços e sem acentos (ex.: `frente-do-local-16x9.jpg`) e, se possível, WebP até ~1600 px de largura.
2. Cadastre em `src/content/media.json`, no grupo certo. Cada foto:
   `{ "src": "/midia/frente-do-local-16x9.jpg", "alt": "descrição objetiva", "largura": 1600, "altura": 900, "foco": "50% 30%" }`
   - `hero` — primeira tela (`frente do local 16x9.jpg`; opcional `"srcMobile"` com versão vertical)
   - `local` — `frente do local.jpg`; `culto` — `espalo de culto.jpg`
   - `quartos` — `quarto.jpg`, `quarto a.jpg`, `quarto b.jpg` (nessa ordem)
   - `adoracao` — `jovens adorando.jpg`, `jovens abraçados adorando.jpg`, `oração e adoração.jpg`, `oração pelo jovem.jpg`
   - `convivencia` — `jovem feliz.jpg`, `jovem na gincana feliz.jpg`, `espaço coberto gincanas.jpg`
   - `foco` evita cortar rostos nos recortes do celular.
3. Vídeo (segunda tela, ocupa a tela inteira ao rolar):
   `"video": { "src": "/midia/retiro.mp4", "poster": "/midia/retiro-capa.jpg", "titulo": "Vídeo do retiro" }`.
   Toca sem som, em laço, só enquanto está visível; não toca com economia de dados ou movimento reduzido.
   Há botões para pausar e ativar o som. Use MP4 (H.264), até ~8 MB, idealmente 1080p vertical/horizontal curto.
4. Use fotos de adoração e oração com respeito: não use imagens de momentos de vulnerabilidade como apelo de inscrição.
5. Arte oficial **DUNAMIS** (opcional): coloque o arquivo em `public/midia/` (PNG com fundo transparente ou SVG) e cadastre
   `"marca": { "src": "/midia/dunamis.png", "alt": "Dunamis — Recebereis poder" }` em `src/content/media.json`.
   Sem ela, o site usa uma versão tipográfica provisória de DUNAMIS (letras condensadas e contornadas).
6. Fotos de choro, lágrimas e toque do Espírito (`choro de adoração.jpg`, `lágrimas de adoração.jpg`,
   `jovem chorando pelo toque do Espírito.jpg`) só entram com autorização expressa das pessoas retratadas.
7. Versões do logo Conexão Jovem em cores (fundo transparente) estão em `public/marca/`: `branca`, `verde`, `verde-vivo` e `sol`.
