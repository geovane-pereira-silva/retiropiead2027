# Fotos e vídeo do retiro

Só entram fotos reais e autorizadas. O que ainda não foi cadastrado aparece na página como
**espaço reservado identificado** (borda tracejada amarela com o nome do arquivo esperado) e some
sozinho quando o arquivo é cadastrado.

1. As fotos oficiais ficam em `public/fotos/`; preserve os nomes de origem e codifique espaços/acentos na URL.
2. Cadastre em `src/content/media.json`, no grupo certo. Cada foto:
   `{ "src": "/fotos/frente%20do%20local%2016x9.jpg", "alt": "descrição objetiva", "largura": 4000, "altura": 2252, "foco": "50% 30%" }`
   - `hero` — primeira tela (`frente do local 16x9.jpg`; opcional `"srcMobile"` com versão vertical)
   - `local` — `frente do local.jpg`; `culto` — `espalo de culto.jpg`
   - `quartos` — `quarto.jpg`, `quarto a.jpg`, `quarto b.jpg` (nessa ordem)
   - `adoracao` — `jovens adorando.jpg`, `jovens abraçados adorando.jpg`, `oração e adoração.jpg`, `oração pelo jovem.jpg`
   - `convivencia` — `jovem feliz.jpg`, `jovem na gincana feliz.jpg`, `espaço coberto gincanas.jpg`
   - Também cadastradas em `adoracao`: `choro de adoração.jpg`, `lagrimas de adoração.jpg` e `jvoem chorando pelo toqe do Espirito.jpg` (uso autorizado pela organização).
   - `foco` evita cortar rostos nos recortes do celular.
3. Vídeo (segunda tela, ocupa a tela inteira ao rolar): publique uma cópia H.264 otimizada abaixo de 100 MB em `public/fotos/` e cadastre-a em `media.json`. Preserve o MP4 original fora do histórico Git. A Vercel suporta Git LFS quando habilitado nas configurações do projeto; no plano Hobby, arquivos estáticos têm limite documentado de 100 MB.
   Toca sem som, em laço, só enquanto está visível; não toca com economia de dados ou movimento reduzido.
   Há botões para pausar e ativar o som. Use MP4 (H.264), em resolução e bitrate adequados à duração, sem exceder o limite do plano Vercel.
4. Use fotos de adoração e oração com respeito: não use imagens de momentos de vulnerabilidade como apelo de inscrição.
5. Arte oficial **DUNAMIS** (opcional): coloque o arquivo em `public/marca/` (PNG com fundo transparente ou SVG) e cadastre
   `"marca": { "src": "/marca/dunamis.png", "alt": "Dunamis — Recebereis poder" }` em `src/content/media.json`.
   Sem ela, o site usa uma versão tipográfica provisória de DUNAMIS (letras condensadas e contornadas).
6. Fotos de momentos de emoção só entram após confirmação de autorização das pessoas retratadas.
7. Versões do logo Conexão Jovem em cores (fundo transparente) estão em `public/marca/`: `branca`, `verde`, `verde-vivo` e `sol`.
