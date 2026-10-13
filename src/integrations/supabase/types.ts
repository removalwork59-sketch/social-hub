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
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity: string
          id: string
          workspace_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          id?: string
          workspace_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          created_at: string
          id: string
          kind: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          user_id?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_daily: {
        Row: {
          day: string
          engagement: number
          followers: number
          id: string
          is_sample: boolean
          platform: Database["public"]["Enums"]["social_platform"]
          reach: number
          workspace_id: string
        }
        Insert: {
          day: string
          engagement?: number
          followers?: number
          id?: string
          is_sample?: boolean
          platform: Database["public"]["Enums"]["social_platform"]
          reach?: number
          workspace_id: string
        }
        Update: {
          day?: string
          engagement?: number
          followers?: number
          id?: string
          is_sample?: boolean
          platform?: Database["public"]["Enums"]["social_platform"]
          reach?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_messages: {
        Row: {
          archived: boolean
          assigned_to: string | null
          author: string
          content: string
          id: string
          is_read: boolean
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
          archived?: boolean
          assigned_to?: string | null
          author: string
          content: string
          id?: string
          is_read?: boolean
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
          archived?: boolean
          assigned_to?: string | null
          author?: string
          content?: string
          id?: string
          is_read?: boolean
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
      mentions: {
        Row: {
          content: string
          created_at: string
          id: string
          is_sample: boolean
          reach: number
          sentiment: string
          source: string
          workspace_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_sample?: boolean
          reach?: number
          sentiment?: string
          source: string
          workspace_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_sample?: boolean
          reach?: number
          sentiment?: string
          source?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_payouts: {
        Row: {
          amount: number
          commission_pct: number
          created_at: string
          id: string
          paid_at: string | null
          partner_id: string
          period: string
          revenue: number
          status: string
        }
        Insert: {
          amount?: number
          commission_pct: number
          created_at?: string
          id?: string
          paid_at?: string | null
          partner_id: string
          period: string
          revenue?: number
          status?: string
        }
        Update: {
          amount?: number
          commission_pct?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          partner_id?: string
          period?: string
          revenue?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_payouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          color: string
          commission_pct: number
          created_at: string
          email: string
          id: string
          name: string
          permissions: Json
          status: string
          user_id: string | null
        }
        Insert: {
          color?: string
          commission_pct?: number
          created_at?: string
          email: string
          id?: string
          name: string
          permissions?: Json
          status?: string
          user_id?: string | null
        }
        Update: {
          color?: string
          commission_pct?: number
          created_at?: string
          email?: string
          id?: string
          name?: string
          permissions?: Json
          status?: string
          user_id?: string | null
        }
        Relationships: []
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
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          due_date: string | null
          id: string
          status: string
          title: string
          workspace_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          status?: string
          title: string
          workspace_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          status?: string
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
          brand_description: string | null
          brand_profile: Json
          brand_tone: string | null
          created_at: string
          custom_domain: string | null
          id: string
          logo_url: string | null
          name: string
          onboarded: boolean
          owner_id: string
          partner_id: string | null
          plan: string
        }
        Insert: {
          brand_color?: string | null
          brand_description?: string | null
          brand_profile?: Json
          brand_tone?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          onboarded?: boolean
          owner_id: string
          partner_id?: string | null
          plan?: string
        }
        Update: {
          brand_color?: string | null
          brand_description?: string | null
          brand_profile?: Json
          brand_tone?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          onboarded?: boolean
          owner_id?: string
          partner_id?: string | null
          plan?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_workspace_member: {
        Args: {
          _email: string
          _role: Database["public"]["Enums"]["workspace_role"]
          _ws: string
        }
        Returns: string
      }
      admin_link_partner_user: {
        Args: { _partner: string; _user: string }
        Returns: undefined
      }
      admin_list_workspaces: {
        Args: never
        Returns: {
          accounts: number
          created_at: string
          id: string
          name: string
          plan: string
          posts: number
        }[]
      }
      admin_partner_clients: {
        Args: never
        Returns: {
          id: string
          name: string
          partner_id: string
          plan: string
        }[]
      }
      admin_platform_stats: { Args: never; Returns: Json }
      admin_set_workspace_partner: {
        Args: { _partner: string; _ws: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_workspace_admin: {
        Args: { _user: string; _ws: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user: string; _ws: string }
        Returns: boolean
      }
      my_partner_id: { Args: never; Returns: string }
      partner_my_clients: {
        Args: never
        Returns: {
          accounts: number
          created_at: string
          id: string
          name: string
          plan: string
          posts: number
        }[]
      }
      seed_sample_history: { Args: { _ws: string }; Returns: undefined }
      seed_sample_inbox: { Args: { _ws: string }; Returns: undefined }
    }
    Enums: {
      app_role: "super_admin" | "partner" | "user"
      inbox_kind: "comment" | "dm" | "mention" | "review"
      inbox_status: "open" | "resolved"
      post_status:
        | "draft"
        | "scheduled"
        | "published"
        | "failed"
        | "pending_approval"
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
      app_role: ["super_admin", "partner", "user"],
      inbox_kind: ["comment", "dm", "mention", "review"],
      inbox_status: ["open", "resolved"],
      post_status: [
        "draft",
        "scheduled",
        "published",
        "failed",
        "pending_approval",
      ],
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
