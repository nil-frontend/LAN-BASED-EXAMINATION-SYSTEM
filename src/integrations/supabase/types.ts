export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_ips: {
        Row: {
          admin_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          id?: string
          ip_address: unknown
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_ips_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string
          exam_id: string | null
          id: string
          percentage: number
          score: number
          started_at: string | null
          student_id: string | null
          total_marks: number
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          exam_id?: string | null
          id?: string
          percentage: number
          score?: number
          started_at?: string | null
          student_id?: string | null
          total_marks: number
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          exam_id?: string | null
          id?: string
          percentage?: number
          score?: number
          started_at?: string | null
          student_id?: string | null
          total_marks?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          exam_end_at: string | null
          exam_entry_block_at: string | null
          exam_name: string | null
          exam_privacy: string | null
          exam_start_at: string | null
          id: string
          is_active: boolean | null
          title: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          exam_end_at?: string | null
          exam_entry_block_at?: string | null
          exam_name?: string | null
          exam_privacy?: string | null
          exam_start_at?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          exam_end_at?: string | null
          exam_entry_block_at?: string | null
          exam_name?: string | null
          exam_privacy?: string | null
          exam_start_at?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_approved: boolean | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_admin: boolean | null
          is_student: boolean | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_approved?: boolean | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_admin?: boolean | null
          is_student?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_approved?: boolean | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_admin?: boolean | null
          is_student?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string
          exam_id: string | null
          id: string
          marks: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          exam_id?: string | null
          id?: string
          marks?: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          exam_id?: string | null
          id?: string
          marks?: number
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
