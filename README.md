# ORA Header — v5

Esta versão segue de forma mais fiel o design de referência enviado.

Principais ajustes:

- imagem quase encostada ao viewport, mas sem tocar totalmente no limite
- efeito de fade/desfoque nas extremidades muito mais subtil
- sem sensação de moldura ou border
- logo, menu e copy reposicionados para se aproximarem da composição original
- texto mais pequeno e calmo
- hotspots discretos e foco circular pequeno no hover
- hero sempre com 100% da altura do viewport

## Ajustes rápidos

No `styles.css`:

- `--frame-pad`: distância mínima da imagem ao limite do viewport
- `--edge-fade`: largura do fade subtil nas extremidades

No `script.js`:

- `--focus-size`: tamanho da zona focada no hover
