import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "list_my_orders",
  title: "Meus pedidos",
  description:
    "Lista os pedidos do usuário autenticado, do mais recente para o mais antigo, com número, status, total, forma de pagamento e itens.",
  inputSchema: {
    limite: z.number().int().optional().describe("Quantidade máxima de pedidos a retornar (padrão 10)."),
    status: z
      .string()
      .optional()
      .describe("Filtra por status: pendente, aceito, preparo, saiu_entrega, finalizado, cancelado, aguardando_pagamento."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limite, status }, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const max = Math.min(Math.max(limite ?? 10, 1), 50);

    let query = supabaseForUser(ctx)
      .from("pedidos")
      .select(
        "id, numero, status, total, subtotal, taxa_entrega, metodo_pagamento, troco, observacao_pagamento, items, endereco, created_at",
      )
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(max);

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return textResult({ total: data?.length ?? 0, pedidos: data ?? [] });
  },
});
