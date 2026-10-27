# Fotos e vídeo do retiro

Só entram fotos reais e autorizadas. Sem arquivo cadastrado, a seção não mostra imagem.

1. Copie os arquivos para `public/midia/` (ex.: `fachada.webp`, `quarto-a.webp`). Prefira WebP, até ~1600 px de largura.
2. Cadastre em `src/content/media.json`, no grupo certo:
   - `local` (fachada e visão geral), `culto` (ambientes de culto), `quartos`, `adoracao`, `convivencia` (gincana, recreação)
   - cada foto: `{ "src": "/midia/fachada.webp", "alt": "descrição objetiva", "largura": 1600, "altura": 1067, "foco": "50% 30%" }`
   - `foco` evita cortar rostos nos recortes do celular.
3. Vídeo (opcional): `"video": { "src": "/midia/tour.mp4", "poster": "/midia/tour-capa.webp", "titulo": "Tour pelo local" }`.
   Ele só carrega quando a pessoa toca em reproduzir, sem som automático.
4. Use fotos de adoração e oração com respeito: não use imagens de momentos de vulnerabilidade como apelo de inscrição.
