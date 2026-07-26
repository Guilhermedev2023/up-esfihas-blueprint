import { defineTool } from "@lovable.dev/mcp-js";
import { errorResult, supabaseForUser, textResult } from "../supabase";

export default defineTool({
  name: "get_store_status",
  title: "Status da loja",
  description:
    "Retorna o horário de funcionamento configurado da loja: dias abertos, hora de abertura, hora de fechamento e eventual override manual (aberto/fechado forçado).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return errorResult("Não autenticado.");
    const { data, error } = await supabaseForUser(ctx)
      .from("horario_funcionamento")
      .select("dias_abertos, dias_semana, hora_abertura, hora_fechamento, override_manual, ativo")
      .limit(1)
      .maybeSingle();
    if (error) return errorResult(error.message);
    if (!data) return errorResult("Horário de funcionamento não configurado.");
    return textResult(data);
  },
});
