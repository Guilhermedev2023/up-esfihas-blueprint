import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_menu",
  title: "Listar cardápio",
  description:
    "Lista os produtos ativos do cardápio da UP Esfihas Artesanais (nome, categoria, descrição e preço). Opcionalmente filtra por categoria ou por texto de busca.",
  inputSchema: {
    categoria: z.string().optional().describe("Filtra por categoria exata, ex: 'Esfihas Salgadas'."),
    busca: z.string().optional().describe("Texto para buscar no nome do produto."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ categoria, busca }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    let query = supabaseForUser(ctx)
      .from("produtos")
      .select("id, nome, categoria, descricao, preco")
      .eq("ativo", true)
      .order("categoria")
      .order("nome");

    if (categoria) query = query.eq("categoria", categoria);
    if (busca) query = query.ilike("nome", `%${busca}%`);

    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return textResult({ total: data?.length ?? 0, produtos: data ?? [] });
  },
});
