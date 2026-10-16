// Product feed for the Meta catalog (Commerce Manager > Data sources > Scheduled feed).
// URL: https://<project>.supabase.co/functions/v1/meta-catalog-feed
// The catalog item "id" is the product UUID, the same value sent as content_ids by the Pixel/CAPI,
// so every Purchase is matched to the exact product sold.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://upesfihasartesanais.com.br").replace(/\/$/, "");
const BRAND = "UP Esfihas Artesanais";

const csvCell = (value: unknown) => {
  const s = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const absoluteUrl = (path: string | null) => {
  if (!path) return `${SITE_URL}/images/logo.jpg`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  const { data, error } = await supabase
    .from("produtos")
    .select("id, nome, descricao, preco, imagem, categoria, ativo")
    .order("categoria")
    .order("nome");

  if (error) return new Response(`error: ${error.message}`, { status: 500 });

  const header = [
    "id", "title", "description", "availability", "condition", "price", "link",
    "image_link", "brand", "product_type", "google_product_category",
  ];

  const rows = (data ?? [])
    .filter((p) => Number(p.preco) > 0 && Number(p.preco) < 1000) // ignora itens de teste
    .map((p) => {
      const title = String(p.nome ?? "").trim();
      return [
        p.id,
        title,
        (p.descricao ?? "").trim() || `${title} - ${BRAND}`,
        p.ativo ? "in stock" : "out of stock",
        "new",
        `${Number(p.preco).toFixed(2)} BRL`,
        `${SITE_URL}/produto/${p.id}`,
        absoluteUrl(p.imagem),
        BRAND,
        p.categoria,
        "Food, Beverages & Tobacco > Food Items",
      ].map(csvCell).join(",");
    });

  return new Response([header.join(","), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, max-age=900",
    },
  });
});
