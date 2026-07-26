import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_delivery_areas",
  title: "Listar bairros atendidos",
  description:
    "Lista os bairros ativos onde a UP Esfihas Artesanais faz entrega em Florianópolis. A taxa de entrega é calculada por distância no checkout.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const { data, error } = await supabaseForUser(ctx)
      .from("bairros")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome");
    if (error) return errorResult(error.message);
    return textResult({ total: data?.length ?? 0, bairros: data ?? [] });
  },
});
