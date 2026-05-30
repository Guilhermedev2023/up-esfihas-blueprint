export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bairros: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          taxa_entrega: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          taxa_entrega?: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          taxa_entrega?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      banner_promocional: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          imagem_url: string | null
          produto_id: string | null
          titulo: string | null
          updated_at: string
          valor_promocional: number | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          imagem_url?: string | null
          produto_id?: string | null
          titulo?: string | null
          updated_at?: string
          valor_promocional?: number | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          imagem_url?: string | null
          produto_id?: string | null
          titulo?: string | null
          updated_at?: string
          valor_promocional?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "banner_promocional_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      cache_distancias: {
        Row: {
          created_at: string
          distancia_km: number
          duracao_segundos: number | null
          endereco_destino: string
          expires_at: string
          id: string
          latitude: number
          longitude: number
        }
        Insert: {
          created_at?: string
          distancia_km: number
          duracao_segundos?: number | null
          endereco_destino: string
          expires_at?: string
          id?: string
          latitude: number
          longitude: number
        }
        Update: {
          created_at?: string
          distancia_km?: number
          duracao_segundos?: number | null
          endereco_destino?: string
          expires_at?: string
          id?: string
          latitude?: number
          longitude?: number
        }
        Relationships: []
      }
      configuracao_pagamento: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          metodo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          metodo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          metodo?: string
          updated_at?: string
        }
        Relationships: []
      }
      configuracao_restaurante: {
        Row: {
          cep: string
          cidade: string
          created_at: string
          endereco: string
          estado: string
          id: string
          latitude: number | null
          longitude: number | null
          updated_at: string
        }
        Insert: {
          cep?: string
          cidade?: string
          created_at?: string
          endereco?: string
          estado?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string
        }
        Update: {
          cep?: string
          cidade?: string
          created_at?: string
          endereco?: string
          estado?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      cupons_desconto: {
        Row: {
          codigo: string
          created_at: string
          desconto_porcentagem: number
          expires_at: string | null
          id: string
          telefone: string
          usado: boolean
        }
        Insert: {
          codigo: string
          created_at?: string
          desconto_porcentagem: number
          expires_at?: string | null
          id?: string
          telefone: string
          usado?: boolean
        }
        Update: {
          codigo?: string
          created_at?: string
          desconto_porcentagem?: number
          expires_at?: string | null
          id?: string
          telefone?: string
          usado?: boolean
        }
        Relationships: []
      }
      faixas_entrega: {
        Row: {
          ativo: boolean
          created_at: string
          distancia_max_km: number
          distancia_min_km: number
          id: string
          taxa_entrega: number
          tempo_estimado_min: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          distancia_max_km: number
          distancia_min_km?: number
          id?: string
          taxa_entrega: number
          tempo_estimado_min?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          distancia_max_km?: number
          distancia_min_km?: number
          id?: string
          taxa_entrega?: number
          tempo_estimado_min?: number
          updated_at?: string
        }
        Relationships: []
      }
      goup_sync_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          pedido_id: string | null
          request_body: Json | null
          response_body: Json | null
          status: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          pedido_id?: string | null
          request_body?: Json | null
          response_body?: Json | null
          status?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          pedido_id?: string | null
          request_body?: Json | null
          response_body?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      horario_funcionamento: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          dias_abertos: Json
          dias_semana: string
          hora_abertura: string
          hora_fechamento: string
          id: string
          override_manual: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          dias_abertos?: Json
          dias_semana?: string
          hora_abertura?: string
          hora_fechamento?: string
          id?: string
          override_manual?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          dias_abertos?: Json
          dias_semana?: string
          hora_abertura?: string
          hora_fechamento?: string
          id?: string
          override_manual?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          created_at: string | null
          endereco: Json
          goup_delivery_id: string | null
          goup_last_error: string | null
          goup_status: string | null
          id: string
          infinitepay_order_nsu: string | null
          infinitepay_receipt_url: string | null
          infinitepay_transaction_nsu: string | null
          items: Json
          metodo_pagamento: string
          numero: number
          observacao_pagamento: string | null
          status: string | null
          subtotal: number
          taxa_entrega: number
          telefone: string
          total: number
          troco: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endereco: Json
          goup_delivery_id?: string | null
          goup_last_error?: string | null
          goup_status?: string | null
          id?: string
          infinitepay_order_nsu?: string | null
          infinitepay_receipt_url?: string | null
          infinitepay_transaction_nsu?: string | null
          items: Json
          metodo_pagamento: string
          numero: number
          observacao_pagamento?: string | null
          status?: string | null
          subtotal: number
          taxa_entrega: number
          telefone: string
          total: number
          troco?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endereco?: Json
          goup_delivery_id?: string | null
          goup_last_error?: string | null
          goup_status?: string | null
          id?: string
          infinitepay_order_nsu?: string | null
          infinitepay_receipt_url?: string | null
          infinitepay_transaction_nsu?: string | null
          items?: Json
          metodo_pagamento?: string
          numero?: number
          observacao_pagamento?: string | null
          status?: string | null
          subtotal?: number
          taxa_entrega?: number
          telefone?: string
          total?: number
          troco?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean | null
          categoria: string
          created_at: string | null
          descricao: string | null
          id: string
          imagem: string | null
          nome: string
          preco: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          imagem?: string | null
          nome: string
          preco: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          imagem?: string | null
          nome?: string
          preco?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bairro: string | null
          created_at: string
          email: string
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bairro?: string | null
          created_at?: string
          email: string
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bairro?: string | null
          created_at?: string
          email?: string
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promocoes: {
        Row: {
          aplicar_delivery: boolean
          aplicar_retirada: boolean
          ativo: boolean
          created_at: string
          desconto_porcentagem: number | null
          desconto_valor: number | null
          dias_semana: Json | null
          id: string
          tipo: string
          tipo_desconto: string
          updated_at: string
          validade_dias: number | null
          valor_minimo_pedido: number | null
        }
        Insert: {
          aplicar_delivery?: boolean
          aplicar_retirada?: boolean
          ativo?: boolean
          created_at?: string
          desconto_porcentagem?: number | null
          desconto_valor?: number | null
          dias_semana?: Json | null
          id?: string
          tipo: string
          tipo_desconto?: string
          updated_at?: string
          validade_dias?: number | null
          valor_minimo_pedido?: number | null
        }
        Update: {
          aplicar_delivery?: boolean
          aplicar_retirada?: boolean
          ativo?: boolean
          created_at?: string
          desconto_porcentagem?: number | null
          desconto_valor?: number | null
          dias_semana?: Json | null
          id?: string
          tipo?: string
          tipo_desconto?: string
          updated_at?: string
          validade_dias?: number | null
          valor_minimo_pedido?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      zonas_entrega: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          poligono: Json
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          poligono?: Json
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          poligono?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_admin_role: {
        Args: { target_user_email: string }
        Returns: undefined
      }
      contar_pedidos_por_telefone: {
        Args: { _telefone: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      proximo_numero_pedido: { Args: never; Returns: number }
      revoke_admin_role: {
        Args: { target_user_email: string }
        Returns: undefined
      }
      usar_cupom: { Args: { _cupom_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
