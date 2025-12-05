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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          product_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          product_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hr_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "legal_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketing_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          product_id: string
          quantity: number | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          product_id: string
          quantity?: number | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hr_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "legal_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketing_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_items: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          product_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          product_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_items_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hr_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "legal_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketing_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_metrics: {
        Row: {
          compliance_tasks_automated_count: number | null
          created_at: string | null
          employee_record_completeness_percentage: number | null
          id: string
          onboarding_time_days: number | null
          payroll_error_rate_percentage: number | null
          product_id: string
          time_to_fill_days: number | null
          updated_at: string | null
        }
        Insert: {
          compliance_tasks_automated_count?: number | null
          created_at?: string | null
          employee_record_completeness_percentage?: number | null
          id?: string
          onboarding_time_days?: number | null
          payroll_error_rate_percentage?: number | null
          product_id: string
          time_to_fill_days?: number | null
          updated_at?: string | null
        }
        Update: {
          compliance_tasks_automated_count?: number | null
          created_at?: string | null
          employee_record_completeness_percentage?: number | null
          id?: string
          onboarding_time_days?: number | null
          payroll_error_rate_percentage?: number | null
          product_id?: string
          time_to_fill_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "hr_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "legal_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "marketing_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products_with_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_metrics: {
        Row: {
          contract_cycle_time_days: number | null
          created_at: string | null
          id: string
          product_id: string
          redlines_per_contract_avg: number | null
          risk_flag_detection_rate_percentage: number | null
          template_reuse_rate_percentage: number | null
          updated_at: string | null
          version_count_avg: number | null
          workflow_automation_steps_count: number | null
        }
        Insert: {
          contract_cycle_time_days?: number | null
          created_at?: string | null
          id?: string
          product_id: string
          redlines_per_contract_avg?: number | null
          risk_flag_detection_rate_percentage?: number | null
          template_reuse_rate_percentage?: number | null
          updated_at?: string | null
          version_count_avg?: number | null
          workflow_automation_steps_count?: number | null
        }
        Update: {
          contract_cycle_time_days?: number | null
          created_at?: string | null
          id?: string
          product_id?: string
          redlines_per_contract_avg?: number | null
          risk_flag_detection_rate_percentage?: number | null
          template_reuse_rate_percentage?: number | null
          updated_at?: string | null
          version_count_avg?: number | null
          workflow_automation_steps_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "hr_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "legal_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "marketing_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products_with_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          created_at: string
          creator_id: string | null
          description: string | null
          public: boolean
          tags: Json | null
          title: string | null
          uid: string
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          description?: string | null
          public?: boolean
          tags?: Json | null
          title?: string | null
          uid?: string
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          description?: string | null
          public?: boolean
          tags?: Json | null
          title?: string | null
          uid?: string
        }
        Relationships: []
      }
      marketing_metrics: {
        Row: {
          attribution_accuracy_error_percentage: number | null
          audience_match_rate_percentage: number | null
          conversion_lift_percentage: number | null
          created_at: string | null
          email_deliverability_percentage: number | null
          engagement_rate_percentage: number | null
          id: string
          lead_cost_usd: number | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          attribution_accuracy_error_percentage?: number | null
          audience_match_rate_percentage?: number | null
          conversion_lift_percentage?: number | null
          created_at?: string | null
          email_deliverability_percentage?: number | null
          engagement_rate_percentage?: number | null
          id?: string
          lead_cost_usd?: number | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          attribution_accuracy_error_percentage?: number | null
          audience_match_rate_percentage?: number | null
          conversion_lift_percentage?: number | null
          created_at?: string | null
          email_deliverability_percentage?: number | null
          engagement_rate_percentage?: number | null
          id?: string
          lead_cost_usd?: number | null
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "hr_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "legal_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "marketing_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products_with_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_price?: number
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hr_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "legal_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketing_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          status: string | null
          total_cost: number
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          status?: string | null
          total_cost: number
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          status?: string | null
          total_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          access_depth: string | null
          category: Database["public"]["Enums"]["product_category"]
          cloud_client_classification:
            | Database["public"]["Enums"]["cloud_client_type"]
            | null
          created_at: string | null
          demo_visual_url: string | null
          id: string
          implementation_time_days: number | null
          is_featured: boolean | null
          is_new: boolean | null
          logo_url: string | null
          long_description: string
          name: string
          price: number
          quarter_over_quarter_change: number | null
          retention_rate: number | null
          roi_percentage: number | null
          seller_id: string
          short_description: string
          updated_at: string | null
        }
        Insert: {
          access_depth?: string | null
          category: Database["public"]["Enums"]["product_category"]
          cloud_client_classification?:
            | Database["public"]["Enums"]["cloud_client_type"]
            | null
          created_at?: string | null
          demo_visual_url?: string | null
          id?: string
          implementation_time_days?: number | null
          is_featured?: boolean | null
          is_new?: boolean | null
          logo_url?: string | null
          long_description: string
          name: string
          price: number
          quarter_over_quarter_change?: number | null
          retention_rate?: number | null
          roi_percentage?: number | null
          seller_id: string
          short_description: string
          updated_at?: string | null
        }
        Update: {
          access_depth?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          cloud_client_classification?:
            | Database["public"]["Enums"]["cloud_client_type"]
            | null
          created_at?: string | null
          demo_visual_url?: string | null
          id?: string
          implementation_time_days?: number | null
          is_featured?: boolean | null
          is_new?: boolean | null
          logo_url?: string | null
          long_description?: string
          name?: string
          price?: number
          quarter_over_quarter_change?: number | null
          retention_rate?: number | null
          roi_percentage?: number | null
          seller_id?: string
          short_description?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          product_id: string
          rating: number
          review_text: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          product_id: string
          rating: number
          review_text?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
          rating?: number
          review_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hr_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "legal_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketing_products_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          title: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          title: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      hr_products_full: {
        Row: {
          access_depth: string | null
          average_rating: number | null
          category: Database["public"]["Enums"]["product_category"] | null
          cloud_client_classification:
            | Database["public"]["Enums"]["cloud_client_type"]
            | null
          compliance_tasks_automated_count: number | null
          created_at: string | null
          demo_visual_url: string | null
          employee_record_completeness_percentage: number | null
          id: string | null
          implementation_time_days: number | null
          is_featured: boolean | null
          is_new: boolean | null
          logo_url: string | null
          long_description: string | null
          name: string | null
          onboarding_time_days: number | null
          payroll_error_rate_percentage: number | null
          price: number | null
          quarter_over_quarter_change: number | null
          retention_rate: number | null
          review_count: number | null
          roi_percentage: number | null
          seller_id: string | null
          short_description: string | null
          time_to_fill_days: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_products_full: {
        Row: {
          access_depth: string | null
          average_rating: number | null
          category: Database["public"]["Enums"]["product_category"] | null
          cloud_client_classification:
            | Database["public"]["Enums"]["cloud_client_type"]
            | null
          contract_cycle_time_days: number | null
          created_at: string | null
          demo_visual_url: string | null
          id: string | null
          implementation_time_days: number | null
          is_featured: boolean | null
          is_new: boolean | null
          logo_url: string | null
          long_description: string | null
          name: string | null
          price: number | null
          quarter_over_quarter_change: number | null
          redlines_per_contract_avg: number | null
          retention_rate: number | null
          review_count: number | null
          risk_flag_detection_rate_percentage: number | null
          roi_percentage: number | null
          seller_id: string | null
          short_description: string | null
          template_reuse_rate_percentage: number | null
          updated_at: string | null
          version_count_avg: number | null
          workflow_automation_steps_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_products_full: {
        Row: {
          access_depth: string | null
          attribution_accuracy_error_percentage: number | null
          audience_match_rate_percentage: number | null
          average_rating: number | null
          category: Database["public"]["Enums"]["product_category"] | null
          cloud_client_classification:
            | Database["public"]["Enums"]["cloud_client_type"]
            | null
          conversion_lift_percentage: number | null
          created_at: string | null
          demo_visual_url: string | null
          email_deliverability_percentage: number | null
          engagement_rate_percentage: number | null
          id: string | null
          implementation_time_days: number | null
          is_featured: boolean | null
          is_new: boolean | null
          lead_cost_usd: number | null
          logo_url: string | null
          long_description: string | null
          name: string | null
          price: number | null
          quarter_over_quarter_change: number | null
          retention_rate: number | null
          review_count: number | null
          roi_percentage: number | null
          seller_id: string | null
          short_description: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products_with_ratings: {
        Row: {
          access_depth: string | null
          average_rating: number | null
          category: Database["public"]["Enums"]["product_category"] | null
          cloud_client_classification:
            | Database["public"]["Enums"]["cloud_client_type"]
            | null
          created_at: string | null
          demo_visual_url: string | null
          id: string | null
          implementation_time_days: number | null
          is_featured: boolean | null
          is_new: boolean | null
          logo_url: string | null
          long_description: string | null
          name: string | null
          price: number | null
          quarter_over_quarter_change: number | null
          retention_rate: number | null
          review_count: number | null
          roi_percentage: number | null
          seller_id: string | null
          short_description: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cloud_client_type: "cloud" | "client" | "hybrid"
      product_category: "HR" | "Law" | "Office" | "Marketing"
      user_role: "buyer" | "seller"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      cloud_client_type: ["cloud", "client", "hybrid"],
      product_category: ["HR", "Law", "Office", "Marketing"],
      user_role: ["buyer", "seller"],
    },
  },
} as const
