// Worker: publicação e leitura da Tabela de Preços pública.
//
// Endpoints:
//   POST /publish  -> grava a tabela no KV (protegido por chave secreta no header)
//   GET  /table    -> devolve a tabela publicada + timestamp (público, sem auth)
//
// Binding esperado: KV namespace "TABLE" (configurar no dashboard).
// Secret esperado: PUBLISH_KEY (configurar no dashboard como variável/secret).

const KV_KEY = "published_table";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Publish-Key",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    // ---- Publicar (protegido) ----
    if (url.pathname === "/publish" && request.method === "POST") {
      const key = request.headers.get("X-Publish-Key");
      if (!env.PUBLISH_KEY || key !== env.PUBLISH_KEY) {
        return json({ error: "unauthorized" }, 401);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "invalid json" }, 400);
      }

      // body esperado: { columns: [...], rows: [...] }
      if (!body || !Array.isArray(body.rows) || !Array.isArray(body.columns)) {
        return json({ error: "expected { columns: [], rows: [] }" }, 400);
      }

      const payload = {
        columns: body.columns,
        rows: body.rows,
        published_at: new Date().toISOString(),
      };

      await env.TABLE.put(KV_KEY, JSON.stringify(payload));
      return json({ ok: true, published_at: payload.published_at });
    }

    // ---- Ler (público) ----
    if (url.pathname === "/table" && request.method === "GET") {
      const stored = await env.TABLE.get(KV_KEY);
      if (!stored) {
        return json({ error: "no table published yet" }, 404);
      }
      return new Response(stored, {
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    return json({ error: "not found" }, 404);
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
