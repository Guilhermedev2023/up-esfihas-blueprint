import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMenu from "./tools/list-menu";
import listDeliveryAreas from "./tools/list-delivery-areas";
import getStoreStatus from "./tools/get-store-status";
import listMyOrders from "./tools/list-my-orders";
import getOrder from "./tools/get-order";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "up-esfihas-mcp",
  title: "UP Esfihas Artesanais",
  version: "0.1.0",
  instructions:
    "Ferramentas da UP Esfihas Artesanais (delivery em Florianópolis). Use `list_menu` para consultar o cardápio, `list_delivery_areas` para os bairros atendidos, `get_store_status` para o horário de funcionamento, e `list_my_orders` / `get_order` para os pedidos do usuário conectado.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listMenu, listDeliveryAreas, getStoreStatus, listMyOrders, getOrder],
});
