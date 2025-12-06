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
          created_at: string
          product_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          product_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
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
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_items: {
        Row: {
          bundle_product_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          bundle_product_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
        }
        Update: {
          bundle_product_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "bundle_items_bundle_product_id_fkey"
            columns: ["bundle_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_product_usage: {
        Row: {
          active_users: number | null
          buyer_id: string
          cost_saved: number | null
          created_at: string | null
          feature_requests: Json | null
          feedback_text: string | null
          id: string
          implementation_completed_at: string | null
          implementation_started_at: string | null
          implementation_status: string | null
          issues_reported: Json | null
          last_used_at: string | null
          order_id: string
          product_id: string
          roi_actual: number | null
          roi_expected: number | null
          satisfaction_score: number | null
          time_saved_hours: number | null
          updated_at: string | null
          usage_count: number | null
          usage_frequency: string | null
        }
        Insert: {
          active_users?: number | null
          buyer_id: string
          cost_saved?: number | null
          created_at?: string | null
          feature_requests?: Json | null
          feedback_text?: string | null
          id?: string
          implementation_completed_at?: string | null
          implementation_started_at?: string | null
          implementation_status?: string | null
          issues_reported?: Json | null
          last_used_at?: string | null
          order_id: string
          product_id: string
          roi_actual?: number | null
          roi_expected?: number | null
          satisfaction_score?: number | null
          time_saved_hours?: number | null
          updated_at?: string | null
          usage_count?: number | null
          usage_frequency?: string | null
        }
        Update: {
          active_users?: number | null
          buyer_id?: string
          cost_saved?: number | null
          created_at?: string | null
          feature_requests?: Json | null
          feedback_text?: string | null
          id?: string
          implementation_completed_at?: string | null
          implementation_started_at?: string | null
          implementation_status?: string | null
          issues_reported?: Json | null
          last_used_at?: string | null
          order_id?: string
          product_id?: string
          roi_actual?: number | null
          roi_expected?: number | null
          satisfaction_score?: number | null
          time_saved_hours?: number | null
          updated_at?: string | null
          usage_count?: number | null
          usage_frequency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_product_usage_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_product_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_product_usage_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          unit_price_cents?: number
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          description: string | null
          id: string
          key: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      competitor_relationships: {
        Row: {
          competitor_product_id: string
          created_at: string | null
          id: string
          market_overlap_score: number | null
          product_id: string
          similarity_score: number | null
          updated_at: string | null
        }
        Insert: {
          competitor_product_id: string
          created_at?: string | null
          id?: string
          market_overlap_score?: number | null
          product_id: string
          similarity_score?: number | null
          updated_at?: string | null
        }
        Update: {
          competitor_product_id?: string
          created_at?: string | null
          id?: string
          market_overlap_score?: number | null
          product_id?: string
          similarity_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_relationships_competitor_product_id_fkey"
            columns: ["competitor_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_relationships_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_definitions: {
        Row: {
          category_id: string | null
          code: string
          data_type: string
          description: string | null
          id: string
          is_filterable: boolean
          is_qualitative: boolean
          label: string
          sort_order: number | null
          unit: string | null
        }
        Insert: {
          category_id?: string | null
          code: string
          data_type: string
          description?: string | null
          id?: string
          is_filterable?: boolean
          is_qualitative?: boolean
          label: string
          sort_order?: number | null
          unit?: string | null
        }
        Update: {
          category_id?: string | null
          code?: string
          data_type?: string
          description?: string | null
          id?: string
          is_filterable?: boolean
          is_qualitative?: boolean
          label?: string
          sort_order?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metric_definitions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          subtotal_cents: number
          unit_price_cents: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          subtotal_cents?: number
          unit_price_cents?: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          subtotal_cents?: number
          unit_price_cents?: number
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
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string
          demo: boolean
          demo_total_cents: number
          id: string
          status: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          demo?: boolean
          demo_total_cents?: number
          id?: string
          status?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          demo?: boolean
          demo_total_cents?: number
          id?: string
          status?: string
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
      product_analytics_daily: {
        Row: {
          bookmarks: number
          cart_adds: number
          comparison_adds: number
          date: string
          detail_page_views: number
          downloads: number
          product_id: string
          purchases: number
          quote_requests: number
          revenue: number
          unique_visitors: number
          views: number
        }
        Insert: {
          bookmarks?: number
          cart_adds?: number
          comparison_adds?: number
          date: string
          detail_page_views?: number
          downloads?: number
          product_id: string
          purchases?: number
          quote_requests?: number
          revenue?: number
          unique_visitors?: number
          views?: number
        }
        Update: {
          bookmarks?: number
          cart_adds?: number
          comparison_adds?: number
          date?: string
          detail_page_views?: number
          downloads?: number
          product_id?: string
          purchases?: number
          quote_requests?: number
          revenue?: number
          unique_visitors?: number
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_analytics_daily_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_comparisons: {
        Row: {
          buyer_id: string
          created_at: string
          product_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          product_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_comparisons_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_comparisons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_downloads: {
        Row: {
          buyer_id: string
          downloaded_at: string
          file_name: string
          file_size_bytes: number | null
          id: string
          order_id: string
          product_id: string
        }
        Insert: {
          buyer_id: string
          downloaded_at?: string
          file_name: string
          file_size_bytes?: number | null
          id?: string
          order_id: string
          product_id: string
        }
        Update: {
          buyer_id?: string
          downloaded_at?: string
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          order_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_downloads_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_downloads_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_downloads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_events: {
        Row: {
          buyer_id: string | null
          event_type: string
          id: number
          metadata: Json | null
          occurred_at: string
          product_id: string
          seller_id: string
          session_id: string | null
        }
        Insert: {
          buyer_id?: string | null
          event_type: string
          id?: number
          metadata?: Json | null
          occurred_at?: string
          product_id: string
          seller_id: string
          session_id?: string | null
        }
        Update: {
          buyer_id?: string | null
          event_type?: string
          id?: number
          metadata?: Json | null
          occurred_at?: string
          product_id?: string
          seller_id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_events_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_events_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_features: {
        Row: {
          created_at: string | null
          display_order: number | null
          feature_category: string | null
          feature_description: string | null
          feature_name: string
          id: string
          is_highlighted: boolean | null
          product_id: string
          relevance_score: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          feature_category?: string | null
          feature_description?: string | null
          feature_name: string
          id?: string
          is_highlighted?: boolean | null
          product_id: string
          relevance_score?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          feature_category?: string | null
          feature_description?: string | null
          feature_name?: string
          id?: string
          is_highlighted?: boolean | null
          product_id?: string
          relevance_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_features_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_files: {
        Row: {
          created_at: string
          file_name: string | null
          file_size_bytes: number | null
          file_type: string | null
          id: string
          is_primary: boolean
          product_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          is_primary?: boolean
          product_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          is_primary?: boolean
          product_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_files_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_flags: {
        Row: {
          created_at: string
          flag: string
          product_id: string
        }
        Insert: {
          created_at?: string
          flag: string
          product_id: string
        }
        Update: {
          created_at?: string
          flag?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_flags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_metric_values: {
        Row: {
          boolean_value: boolean | null
          last_updated: string
          metric_id: string
          numeric_value: number | null
          product_id: string
          string_value: string | null
        }
        Insert: {
          boolean_value?: boolean | null
          last_updated?: string
          metric_id: string
          numeric_value?: number | null
          product_id: string
          string_value?: string | null
        }
        Update: {
          boolean_value?: boolean | null
          last_updated?: string
          metric_id?: string
          numeric_value?: number | null
          product_id?: string
          string_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_metric_values_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metric_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_metric_values_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_scores: {
        Row: {
          calculated_at: string | null
          feature_score: number | null
          fit_score: number | null
          id: string
          integration_score: number | null
          overall_score: number | null
          product_id: string
          review_score: number | null
          score_breakdown: Json | null
          updated_at: string | null
        }
        Insert: {
          calculated_at?: string | null
          feature_score?: number | null
          fit_score?: number | null
          id?: string
          integration_score?: number | null
          overall_score?: number | null
          product_id: string
          review_score?: number | null
          score_breakdown?: Json | null
          updated_at?: string | null
        }
        Update: {
          calculated_at?: string | null
          feature_score?: number | null
          fit_score?: number | null
          id?: string
          integration_score?: number | null
          overall_score?: number | null
          product_id?: string
          review_score?: number | null
          score_breakdown?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_scores_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          bundle_pricing_mode: string
          category_id: string | null
          created_at: string
          demo_visual_url: string | null
          id: string
          is_bundle: boolean
          is_featured: boolean
          logo_url: string | null
          long_description: string | null
          name: string
          price_cents: number
          seller_id: string
          short_description: string
          slug: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bundle_pricing_mode?: string
          category_id?: string | null
          created_at?: string
          demo_visual_url?: string | null
          id?: string
          is_bundle?: boolean
          is_featured?: boolean
          logo_url?: string | null
          long_description?: string | null
          name: string
          price_cents?: number
          seller_id: string
          short_description: string
          slug?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          bundle_pricing_mode?: string
          category_id?: string | null
          created_at?: string
          demo_visual_url?: string | null
          id?: string
          is_bundle?: boolean
          is_featured?: boolean
          logo_url?: string | null
          long_description?: string | null
          name?: string
          price_cents?: number
          seller_id?: string
          short_description?: string
          slug?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
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
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          role_buyer: boolean
          role_seller: boolean
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role_buyer?: boolean
          role_seller?: boolean
        }
        Update: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role_buyer?: boolean
          role_seller?: boolean
        }
        Relationships: []
      }
      quotes: {
        Row: {
          additional_notes: string | null
          buyer_company_info: Json | null
          buyer_id: string
          company_size: number | null
          created_at: string | null
          estimated_response_date: string | null
          id: string
          pricing_breakdown: Json | null
          product_id: string
          quoted_price: number
          requirements: Json | null
          seller_id: string
          seller_notified: boolean | null
          sent_to_seller_at: string | null
          status: string | null
          updated_at: string | null
          valid_until: string
        }
        Insert: {
          additional_notes?: string | null
          buyer_company_info?: Json | null
          buyer_id: string
          company_size?: number | null
          created_at?: string | null
          estimated_response_date?: string | null
          id?: string
          pricing_breakdown?: Json | null
          product_id: string
          quoted_price: number
          requirements?: Json | null
          seller_id: string
          seller_notified?: boolean | null
          sent_to_seller_at?: string | null
          status?: string | null
          updated_at?: string | null
          valid_until: string
        }
        Update: {
          additional_notes?: string | null
          buyer_company_info?: Json | null
          buyer_id?: string
          company_size?: number | null
          created_at?: string | null
          estimated_response_date?: string | null
          id?: string
          pricing_breakdown?: Json | null
          product_id?: string
          quoted_price?: number
          requirements?: Json | null
          seller_id?: string
          seller_notified?: boolean | null
          sent_to_seller_at?: string | null
          status?: string | null
          updated_at?: string | null
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          buyer_id: string
          created_at: string
          id: string
          product_id: string
          rating: number
          title: string | null
        }
        Insert: {
          body?: string | null
          buyer_id: string
          created_at?: string
          id?: string
          product_id: string
          rating: number
          title?: string | null
        }
        Update: {
          body?: string | null
          buyer_id?: string
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          title?: string | null
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
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      product_analytics: {
        Row: {
          bookmarks: number | null
          cart_adds: number | null
          comparison_adds: number | null
          date: string | null
          detail_page_views: number | null
          downloads: number | null
          product_id: string | null
          purchases: number | null
          quote_requests: number | null
          revenue: number | null
          unique_visitors: number | null
          views: number | null
        }
        Insert: {
          bookmarks?: number | null
          cart_adds?: number | null
          comparison_adds?: number | null
          date?: string | null
          detail_page_views?: number | null
          downloads?: number | null
          product_id?: string | null
          purchases?: number | null
          quote_requests?: number | null
          revenue?: number | null
          unique_visitors?: number | null
          views?: number | null
        }
        Update: {
          bookmarks?: number | null
          cart_adds?: number | null
          comparison_adds?: number | null
          date?: string | null
          detail_page_views?: number | null
          downloads?: number | null
          product_id?: string | null
          purchases?: number | null
          quote_requests?: number | null
          revenue?: number | null
          unique_visitors?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_analytics_daily_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
