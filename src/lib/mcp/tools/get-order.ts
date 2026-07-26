import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "get_order",
  title: "Detalhes do pedido",
  description:
    "Retorna os detalhes completos de um pedido do usuário autenticado, buscando pelo número do pedido.",
  inputSchema: {
    numero: z.number().int().describe("Número sequencial do pedido."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ numero }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const { data, error } = await supabaseForUser(ctx)
      .from("pedidos")
      .select("*")
      .eq("user_id", ctx.getUserId())
      .eq("numero", numero)
      .maybeSingle();
    if (error) return errorResult(error.message);
    if (!data) return errorResult(`Pedido #${numero} não encontrado para este usuário.`);
    return textResult(data);
  },
});
