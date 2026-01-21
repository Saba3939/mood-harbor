/**
 * Supabase データベース型定義
 * `supabase gen types typescript --project-id msxvtrhedggyisvnjqva > lib/supabase/database.types.ts` で自動生成可能
 * 現在は手動定義（将来的にSupabase CLIで生成）
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          nickname: string;
          avatar_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          nickname: string;
          avatar_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          nickname?: string;
          avatar_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      mood_records: {
        Row: {
          id: string;
          user_id: string;
          mood_level: number;
          reasons: string[];
          question_id: string;
          answer_option: string;
          memo: string | null;
          time_of_day: string | null;
          weather: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mood_level: number;
          reasons: string[];
          question_id: string;
          answer_option: string;
          memo?: string | null;
          time_of_day?: string | null;
          weather?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mood_level?: number;
          reasons?: string[];
          question_id?: string;
          answer_option?: string;
          memo?: string | null;
          time_of_day?: string | null;
          weather?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_questions: {
        Row: {
          id: string;
          category: string;
          question_text: string;
          options: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          question_text: string;
          options: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          question_text?: string;
          options?: string[];
          created_at?: string;
        };
      };
      shares: {
        Row: {
          id: string;
          user_id: string;
          mood_record_id: string;
          share_type: string;
          feeling: string;
          message: string | null;
          reaction_count: number;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mood_record_id: string;
          share_type: string;
          feeling: string;
          message?: string | null;
          reaction_count?: number;
          created_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mood_record_id?: string;
          share_type?: string;
          feeling?: string;
          message?: string | null;
          reaction_count?: number;
          created_at?: string;
          expires_at?: string;
        };
      };
      reactions: {
        Row: {
          id: string;
          user_id: string;
          share_id: string;
          stamp_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          share_id: string;
          stamp_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          share_id?: string;
          stamp_type?: string;
          created_at?: string;
        };
      };
      notification_settings: {
        Row: {
          user_id: string;
          record_reminder_enabled: boolean;
          record_reminder_time: string;
          reaction_notification_mode: string;
          quiet_mode_enabled: boolean;
          quiet_mode_start: string | null;
          quiet_mode_end: string | null;
          pause_until: string | null;
        };
        Insert: {
          user_id: string;
          record_reminder_enabled?: boolean;
          record_reminder_time?: string;
          reaction_notification_mode?: string;
          quiet_mode_enabled?: boolean;
          quiet_mode_start?: string | null;
          quiet_mode_end?: string | null;
          pause_until?: string | null;
        };
        Update: {
          user_id?: string;
          record_reminder_enabled?: boolean;
          record_reminder_time?: string;
          reaction_notification_mode?: string;
          quiet_mode_enabled?: boolean;
          quiet_mode_start?: string | null;
          quiet_mode_end?: string | null;
          pause_until?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
