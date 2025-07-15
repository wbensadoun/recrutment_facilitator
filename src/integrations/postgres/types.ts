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
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          changed_by: string | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          changed_by?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          changed_by?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "recruiters"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_users: {
        Row: {
          created_at: string
          id: string
          name: string
          password: string
          role: string
          updated_at: string
          email: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          password: string
          role: string
          updated_at?: string
          email: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          password?: string
          role?: string
          updated_at?: string
          email?: string
        }
        Relationships: []
      }
      candidate_comments: {
        Row: {
          candidate_id: string | null
          comment: string
          created_at: string
          id: string
          recruiter_id: string | null
          stage: Database["public"]["Enums"]["stage_type"] | null
        }
        Insert: {
          candidate_id?: string | null
          comment: string
          created_at?: string
          id?: string
          recruiter_id?: string | null
          stage?: Database["public"]["Enums"]["stage_type"] | null
        }
        Update: {
          candidate_id?: string | null
          comment?: string
          created_at?: string
          id?: string
          recruiter_id?: string | null
          stage?: Database["public"]["Enums"]["stage_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_comments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_comments_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "recruiters"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          created_at: string
          current_stage: Database["public"]["Enums"]["stage_type"]
          cv_url: string | null
          email: string
          experience: string | null
          id: string
          last_interview_date: string | null
          name: string
          phone: string | null
          position: string
          recruiter_id: string | null
          status: Database["public"]["Enums"]["candidate_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_stage?: Database["public"]["Enums"]["stage_type"]
          cv_url?: string | null
          email: string
          experience?: string | null
          id?: string
          last_interview_date?: string | null
          name: string
          phone?: string | null
          position: string
          recruiter_id?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_stage?: Database["public"]["Enums"]["stage_type"]
          cv_url?: string | null
          email?: string
          experience?: string | null
          id?: string
          last_interview_date?: string | null
          name?: string
          phone?: string | null
          position?: string
          recruiter_id?: string | null
          status?: Database["public"]["Enums"]["candidate_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "recruiters"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          candidate_id: string | null
          created_at: string
          id: string
          notes: string | null
          recruiter_id: string | null
          scheduled_date: string
          stage: Database["public"]["Enums"]["stage_type"]
          status: Database["public"]["Enums"]["candidate_status"]
          updated_at: string
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          recruiter_id?: string | null
          scheduled_date: string
          stage: Database["public"]["Enums"]["stage_type"]
          status?: Database["public"]["Enums"]["candidate_status"]
          updated_at?: string
        }
        Update: {
          candidate_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          recruiter_id?: string | null
          scheduled_date?: string
          stage?: Database["public"]["Enums"]["stage_type"]
          status?: Database["public"]["Enums"]["candidate_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "recruiters"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          stage_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          stage_order: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          stage_order?: number
        }
        Relationships: []
      }
      recruiter_permissions: {
        Row: {
          created_at: string
          id: string
          permissions: string[]
          recruiter_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: string[]
          recruiter_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: string[]
          recruiter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_permissions_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: true
            referencedRelation: "recruiters"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiters: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          status: Database["public"]["Enums"]["recruiter_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["recruiter_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["recruiter_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      audit_action:
        | "created"
        | "updated"
        | "deleted"
        | "status_changed"
        | "stage_changed"
      candidate_status: "in_progress" | "scheduled" | "validated" | "rejected"
      recruiter_status: "active" | "disabled"
      stage_type:
        | "soft_skills"
        | "technical_interview"
        | "client_meeting"
        | "custom_stage"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
