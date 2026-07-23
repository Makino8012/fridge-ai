// 手動管理の型定義。Supabase CLIが使える環境では
// `supabase gen types typescript --local > types/database.types.ts` で自動生成に置き換えること。
// マイグレーション(supabase/migrations/*)と齟齬が出た場合はマイグレーションを正とする。

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CategoryId =
  | 'vegetable'
  | 'meat'
  | 'fish'
  | 'drink'
  | 'frozen'
  | 'seasoning'
  | 'other';

export type StorageLocationId = 'fridge' | 'freezer' | 'room_temp';

export type IngredientSource = 'manual' | 'receipt_ocr' | 'barcode';
export type IngredientLogReason = 'used_in_recipe' | 'purchased' | 'expired_disposed' | 'manual_adjust';
export type ShoppingItemSource = 'manual' | 'ai_suggested';
export type RecipeRequestType =
  | 'recipe_suggest'
  | 'missing_ingredients'
  | 'menu_plan'
  | 'shopping_list'
  | 'waste_reduction';

export interface DietaryPreferences {
  allergies: string[];
  dislikes: string[];
  diet: 'high_protein' | 'low_fat' | null;
}

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          invite_token: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['households']['Row']>;
        Update: Partial<Database['public']['Tables']['households']['Row']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          household_id: string | null;
          display_name: string;
          avatar_url: string | null;
          dietary_preferences: DietaryPreferences;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      categories: {
        Row: { id: CategoryId; label_ja: string; icon: string; sort_order: number };
        Insert: Database['public']['Tables']['categories']['Row'];
        Update: Partial<Database['public']['Tables']['categories']['Row']>;
        Relationships: [];
      };
      storage_locations: {
        Row: { id: StorageLocationId; label_ja: string; sort_order: number };
        Insert: Database['public']['Tables']['storage_locations']['Row'];
        Update: Partial<Database['public']['Tables']['storage_locations']['Row']>;
        Relationships: [];
      };
      ingredients: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          quantity: number;
          unit: string;
          category_id: CategoryId;
          storage_location_id: StorageLocationId;
          expiry_date: string | null;
          memo: string | null;
          source: IngredientSource;
          barcode: string | null;
          image_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['ingredients']['Row']> & {
          household_id: string;
          name: string;
          category_id: CategoryId;
          storage_location_id: StorageLocationId;
        };
        Update: Partial<Database['public']['Tables']['ingredients']['Row']>;
        Relationships: [];
      };
      ingredient_logs: {
        Row: {
          id: string;
          ingredient_id: string;
          household_id: string;
          quantity_delta: number;
          reason: IngredientLogReason;
          actor_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['ingredient_logs']['Row']> & {
          ingredient_id: string;
          household_id: string;
          quantity_delta: number;
          reason: IngredientLogReason;
        };
        Update: Partial<Database['public']['Tables']['ingredient_logs']['Row']>;
        Relationships: [];
      };
      shopping_list_items: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          quantity: number | null;
          unit: string | null;
          is_checked: boolean;
          source: ShoppingItemSource;
          created_by: string | null;
          checked_by: string | null;
          created_at: string;
          checked_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['shopping_list_items']['Row']> & {
          household_id: string;
          name: string;
        };
        Update: Partial<Database['public']['Tables']['shopping_list_items']['Row']>;
        Relationships: [];
      };
      recipe_favorites: {
        Row: {
          id: string;
          household_id: string;
          title: string;
          recipe_data: Json;
          saved_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['recipe_favorites']['Row']> & {
          household_id: string;
          title: string;
          recipe_data: Json;
        };
        Update: Partial<Database['public']['Tables']['recipe_favorites']['Row']>;
        Relationships: [];
      };
      recipe_history: {
        Row: {
          id: string;
          household_id: string;
          request_type: RecipeRequestType;
          request_input: Json;
          response_data: Json;
          requested_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['recipe_history']['Row']> & {
          household_id: string;
          request_type: RecipeRequestType;
          request_input: Json;
          response_data: Json;
        };
        Update: Partial<Database['public']['Tables']['recipe_history']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      join_household_by_invite: {
        Args: { p_invite_token: string; p_display_name: string };
        Returns: string;
      };
      create_household: {
        Args: { p_name: string; p_display_name: string };
        Returns: string;
      };
      regenerate_invite_token: {
        Args: Record<string, never>;
        Returns: string;
      };
      adjust_ingredient_quantity: {
        Args: { p_ingredient_id: string; p_delta: number; p_reason: IngredientLogReason };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
