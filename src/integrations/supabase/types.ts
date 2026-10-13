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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      inbox_messages: {
        Row: {
          author: string
          content: string
          id: string
          is_sample: boolean
          kind: Database["public"]["Enums"]["inbox_kind"]
          platform: Database["public"]["Enums"]["social_platform"]
          received_at: string
          resolved_at: string | null
          sentiment: string
          status: Database["public"]["Enums"]["inbox_status"]
          workspace_id: string
        }
        Insert: {
          author: string
          content: string
          id?: string
          is_sample?: boolean
          kind?: Database["public"]["Enums"]["inbox_kind"]
          platform: Database["public"]["Enums"]["social_platform"]
          received_at?: string
          resolved_at?: string | null
          sentiment?: string
          status?: Database["public"]["Enums"]["inbox_status"]
          workspace_id: string
        }
        Update: {
          author?: string
          content?: string
          id?: string
          is_sample?: boolean
          kind?: Database["public"]["Enums"]["inbox_kind"]
          platform?: Database["public"]["Enums"]["social_platform"]
          received_at?: string
          resolved_at?: string | null
          sentiment?: string
          status?: Database["public"]["Enums"]["inbox_status"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          platforms: Database["public"]["Enums"]["social_platform"][]
          scheduled_at: string | null
          status: Database["public"]["Enums"]["post_status"]
          workspace_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string
          id?: string
          platforms?: Database["public"]["Enums"]["social_platform"][]
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          workspace_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          platforms?: Database["public"]["Enums"]["social_platform"][]
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          connected_at: string
          handle: string
          id: string
          platform: Database["public"]["Enums"]["social_platform"]
          status: string
          workspace_id: string
        }
        Insert: {
          connected_at?: string
          handle: string
          id?: string
          platform: Database["public"]["Enums"]["social_platform"]
          status?: string
          workspace_id: string
        }
        Update: {
          connected_at?: string
          handle?: string
          id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          brand_color: string | null
          created_at: string
          custom_domain: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          plan: string
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          plan?: string
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          plan?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_workspace_admin: {
        Args: { _user: string; _ws: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user: string; _ws: string }
        Returns: boolean
      }
      seed_sample_inbox: { Args: { _ws: string }; Returns: undefined }
    }
    Enums: {
      inbox_kind: "comment" | "dm" | "mention" | "review"
      inbox_status: "open" | "resolved"
      post_status: "draft" | "scheduled" | "published" | "failed"
      social_platform:
        | "facebook"
        | "instagram"
        | "linkedin"
        | "twitter"
        | "google_business"
      workspace_role: "owner" | "admin" | "member"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      inbox_kind: ["comment", "dm", "mention", "review"],
      inbox_status: ["open", "resolved"],
      post_status: ["draft", "scheduled", "published", "failed"],
      social_platform: [
        "facebook",
        "instagram",
        "linkedin",
        "twitter",
        "google_business",
      ],
      workspace_role: ["owner", "admin", "member"],
    },
  },
} as const
