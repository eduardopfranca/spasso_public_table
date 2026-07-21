# Spasso — Tabela de Preços Pública

Site público (view-only) da Tabela de Preços de Originação do Grupo Spasso.
O app de precificação publica a tabela; este site a exibe, sem login.

## Estrutura
- `public/index.html` — site estático (Cloudflare Pages). Lê a tabela do Worker e filtra por commodity/praça no navegador.
- `worker/worker.js` — Cloudflare Worker. `POST /publish` (protegido) grava no KV; `GET /table` (público) serve a tabela.

## Infra
- Cloudflare Pages (hospedagem do site) + Worker + KV (persistência).
- Deploy automático via push no branch `main`.
