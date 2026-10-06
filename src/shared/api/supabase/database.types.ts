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
      article_comments: {
        Row: {
          article_id: number
          content: string
          created_at: string
          id: number
          updated_at: string
          writer_id: number
        }
        Insert: {
          article_id: number
          content: string
          created_at?: string
          id?: never
          updated_at?: string
          writer_id?: number
        }
        Update: {
          article_id?: number
          content?: string
          created_at?: string
          id?: never
          updated_at?: string
          writer_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_comments_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_likes: {
        Row: {
          article_id: number
          created_at: string
          user_id: number
        }
        Insert: {
          article_id: number
          created_at?: string
          user_id?: number
        }
        Update: {
          article_id?: number
          created_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_likes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_likes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          content: string
          created_at: string
          id: number
          image: string | null
          title: string
          updated_at: string
          writer_id: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: never
          image?: string | null
          title: string
          updated_at?: string
          writer_id?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: never
          image?: string | null
          title?: string
          updated_at?: string
          writer_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "articles_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          clock_in_at: string
          clock_out_at: string | null
          created_at: string
          date: string
          id: number
          user_id: number
        }
        Insert: {
          clock_in_at: string
          clock_out_at?: string | null
          created_at?: string
          date: string
          id?: never
          user_id: number
        }
        Update: {
          clock_in_at?: string
          clock_out_at?: string | null
          created_at?: string
          date?: string
          id?: never
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          id: number
          image: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: never
          image?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: never
          image?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          created_at: string
          date: string
          decided_at: string | null
          decided_by: number | null
          id: number
          reason: string | null
          status: string
          updated_at: string
          user_id: number
        }
        Insert: {
          created_at?: string
          date: string
          decided_at?: string | null
          decided_by?: number | null
          id?: never
          reason?: string | null
          status?: string
          updated_at?: string
          user_id: number
        }
        Update: {
          created_at?: string
          date?: string
          decided_at?: string | null
          decided_by?: number | null
          id?: never
          reason?: string | null
          status?: string
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          group_id: number
          role: string
          user_id: number
        }
        Insert: {
          created_at?: string
          group_id: number
          role?: string
          user_id: number
        }
        Update: {
          created_at?: string
          group_id?: number
          role?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          core_end: string | null
          core_start: string | null
          created_at: string
          grace_minutes: number | null
          id: number
          is_default: boolean
          name: string
          type: string
          updated_at: string
          work_start: string | null
        }
        Insert: {
          core_end?: string | null
          core_start?: string | null
          created_at?: string
          grace_minutes?: number | null
          id?: never
          is_default?: boolean
          name: string
          type: string
          updated_at?: string
          work_start?: string | null
        }
        Update: {
          core_end?: string | null
          core_start?: string | null
          created_at?: string
          grace_minutes?: number | null
          id?: never
          is_default?: boolean
          name?: string
          type?: string
          updated_at?: string
          work_start?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_id: string
          company_role: string
          created_at: string
          email: string
          hired_on: string
          id: number
          image: string | null
          is_active: boolean
          nickname: string
          policy_id: number | null
          presence_status: string
          updated_at: string
        }
        Insert: {
          auth_id: string
          company_role?: string
          created_at?: string
          email: string
          hired_on?: string
          id?: never
          image?: string | null
          is_active?: boolean
          nickname: string
          policy_id?: number | null
          presence_status?: string
          updated_at?: string
        }
        Update: {
          auth_id?: string
          company_role?: string
          created_at?: string
          email?: string
          hired_on?: string
          id?: never
          image?: string | null
          is_active?: boolean
          nickname?: string
          policy_id?: number | null
          presence_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      recurrings: {
        Row: {
          created_at: string
          description: string | null
          frequency_type: string
          group_id: number
          id: number
          month_day: number | null
          name: string
          start_date: string
          task_list_id: number
          updated_at: string
          week_days: number[]
          writer_id: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          frequency_type: string
          group_id: number
          id?: never
          month_day?: number | null
          name: string
          start_date: string
          task_list_id: number
          updated_at?: string
          week_days?: number[]
          writer_id?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          frequency_type?: string
          group_id?: number
          id?: never
          month_day?: number | null
          name?: string
          start_date?: string
          task_list_id?: number
          updated_at?: string
          week_days?: number[]
          writer_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recurrings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrings_task_list_id_fkey"
            columns: ["task_list_id"]
            isOneToOne: false
            referencedRelation: "task_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrings_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: number
          task_id: number
          updated_at: string
          user_id: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: never
          task_id: number
          updated_at?: string
          user_id?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: never
          task_id?: number
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_lists: {
        Row: {
          created_at: string
          display_index: number
          group_id: number
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_index?: number
          group_id: number
          id?: never
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_index?: number
          group_id?: number
          id?: never
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_lists_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          date: string
          deleted_at: string | null
          description: string | null
          display_index: number
          done_at: string | null
          done_by: number | null
          id: number
          is_customized: boolean
          name: string
          recurring_id: number
          task_list_id: number
          updated_at: string
          writer_id: number | null
        }
        Insert: {
          created_at?: string
          date: string
          deleted_at?: string | null
          description?: string | null
          display_index?: number
          done_at?: string | null
          done_by?: number | null
          id?: never
          is_customized?: boolean
          name: string
          recurring_id: number
          task_list_id: number
          updated_at?: string
          writer_id?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          deleted_at?: string | null
          description?: string | null
          display_index?: number
          done_at?: string | null
          done_by?: number | null
          id?: never
          is_customized?: boolean
          name?: string
          recurring_id?: number
          task_list_id?: number
          updated_at?: string
          writer_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_done_by_fkey"
            columns: ["done_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurrings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_task_list_id_fkey"
            columns: ["task_list_id"]
            isOneToOne: false
            referencedRelation: "task_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_post_comments: {
        Row: {
          content: string
          created_at: string
          id: number
          post_id: number
          updated_at: string
          writer_id: number | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: never
          post_id: number
          updated_at?: string
          writer_id?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: never
          post_id?: number
          updated_at?: string
          writer_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "team_post_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "team_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_post_comments_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_posts: {
        Row: {
          content: string
          created_at: string
          group_id: number
          id: number
          image: string | null
          is_notice: boolean
          title: string
          updated_at: string
          writer_id: number | null
        }
        Insert: {
          content: string
          created_at?: string
          group_id: number
          id?: never
          image?: string | null
          is_notice?: boolean
          title: string
          updated_at?: string
          writer_id?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: number
          id?: never
          image?: string | null
          is_notice?: boolean
          title?: string
          updated_at?: string
          writer_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_posts_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      article_comment_view: {
        Row: {
          article_id: number | null
          content: string | null
          created_at: string | null
          id: number | null
          updated_at: string | null
          writer_id: number | null
          writer_image: string | null
          writer_nickname: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_comments_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_view: {
        Row: {
          comment_count: number | null
          content: string | null
          created_at: string | null
          id: number | null
          image: string | null
          is_liked: boolean | null
          like_count: number | null
          title: string | null
          updated_at: string | null
          writer_id: number | null
          writer_image: string | null
          writer_nickname: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comment_view: {
        Row: {
          content: string | null
          created_at: string | null
          id: number | null
          task_id: number | null
          updated_at: string | null
          user_id: number | null
          user_image: string | null
          user_nickname: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_post_comment_view: {
        Row: {
          content: string | null
          created_at: string | null
          id: number | null
          post_id: number | null
          updated_at: string | null
          writer_id: number | null
          writer_image: string | null
          writer_nickname: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "team_post_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "team_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_post_comments_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_post_view: {
        Row: {
          comment_count: number | null
          content: string | null
          created_at: string | null
          group_id: number | null
          id: number | null
          image: string | null
          is_notice: boolean | null
          title: string | null
          updated_at: string | null
          writer_id: number | null
          writer_image: string | null
          writer_nickname: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_posts_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_employees: { Args: { p_from: string; p_to: string }; Returns: Json }
      admin_policies: { Args: never; Returns: Json }
      admin_update_employee: {
        Args: {
          p_company_role?: string
          p_hired_on?: string
          p_nickname?: string
          p_user_id: number
        }
        Returns: undefined
      }
      attendance_range: {
        Args: { p_from: string; p_to: string; p_user_id?: number }
        Returns: Json
      }
      attendance_range_json: {
        Args: { p_from: string; p_to: string; p_user_id: number }
        Returns: Json
      }
      attendance_record_json: {
        Args: {
          p_record: Database["public"]["Tables"]["attendance_records"]["Row"]
        }
        Returns: Json
      }
      can_access_task: { Args: { p_task_id: number }; Returns: boolean }
      can_access_task_list: {
        Args: { p_task_list_id: number }
        Returns: boolean
      }
      can_access_team_channel: { Args: { p_topic: string }; Returns: boolean }
      can_decide_leave_of: { Args: { p_user_id: number }; Returns: boolean }
      can_view_attendance: { Args: { p_user_id: number }; Returns: boolean }
      cancel_leave: { Args: { p_request_id: number }; Returns: undefined }
      check_attendance_range: {
        Args: { p_from: string; p_to: string }
        Returns: undefined
      }
      clock_in: { Args: never; Returns: Json }
      clock_out: { Args: never; Returns: Json }
      create_group: {
        Args: { p_image?: string; p_name: string }
        Returns: Json
      }
      create_recurring: {
        Args: {
          p_description?: string
          p_frequency_type: string
          p_month_day?: number
          p_name: string
          p_start_date?: string
          p_task_list_id: number
          p_week_days?: number[]
        }
        Returns: Json
      }
      current_profile_id: { Args: never; Returns: number }
      decide_leave: {
        Args: { p_approve: boolean; p_request_id: number }
        Returns: Json
      }
      delete_task: { Args: { p_task_id: number }; Returns: undefined }
      effective_policy: {
        Args: { p_user_id: number }
        Returns: {
          core_end: string | null
          core_start: string | null
          created_at: string
          grace_minutes: number | null
          id: number
          is_default: boolean
          name: string
          type: string
          updated_at: string
          work_start: string | null
        }
        SetofOptions: {
          from: "*"
          to: "policies"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_group: { Args: { p_group_id: number }; Returns: Json }
      get_me: { Args: never; Returns: Json }
      get_task: { Args: { p_task_id: number }; Returns: Json }
      group_json: {
        Args: { p_group: Database["public"]["Tables"]["groups"]["Row"] }
        Returns: Json
      }
      is_active_profile: { Args: { p_profile_id: number }; Returns: boolean }
      is_admin: { Args: { p_group_id: number }; Returns: boolean }
      is_hr_admin: { Args: never; Returns: boolean }
      is_member: { Args: { p_group_id: number }; Returns: boolean }
      is_nickname_available: { Args: { p_nickname: string }; Returns: boolean }
      is_team_leader_of: { Args: { p_user_id: number }; Returns: boolean }
      kst_midnight: { Args: { p_date: string }; Returns: string }
      kst_naive_iso: { Args: { p_at: string }; Returns: string }
      leave_request_json: {
        Args: {
          p_request: Database["public"]["Tables"]["leave_requests"]["Row"]
        }
        Returns: Json
      }
      member_json: {
        Args: {
          p_membership: Database["public"]["Tables"]["memberships"]["Row"]
          p_profile: Database["public"]["Tables"]["profiles"]["Row"]
        }
        Returns: Json
      }
      occurs_on: {
        Args: {
          p_date: string
          p_recurring: Database["public"]["Tables"]["recurrings"]["Row"]
        }
        Returns: boolean
      }
      policy_json: {
        Args: { p_policy: Database["public"]["Tables"]["policies"]["Row"] }
        Returns: Json
      }
      recurring_json: {
        Args: { p_recurring: Database["public"]["Tables"]["recurrings"]["Row"] }
        Returns: Json
      }
      request_leave: {
        Args: { p_date: string; p_reason?: string }
        Returns: Json
      }
      require_hr_admin: { Args: never; Returns: number }
      require_login: { Args: never; Returns: number }
      require_task: {
        Args: { p_task_id: number }
        Returns: {
          created_at: string
          date: string
          deleted_at: string | null
          description: string | null
          display_index: number
          done_at: string | null
          done_by: number | null
          id: number
          is_customized: boolean
          name: string
          recurring_id: number
          task_list_id: number
          updated_at: string
          writer_id: number | null
        }
        SetofOptions: {
          from: "*"
          to: "tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      require_task_list: {
        Args: { p_task_list_id: number }
        Returns: {
          created_at: string
          display_index: number
          group_id: number
          id: number
          name: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "task_lists"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_leave_requests: { Args: { p_pending?: boolean }; Returns: Json }
      set_default_policy: { Args: { p_policy_id: number }; Returns: undefined }
      set_employee_active: {
        Args: { p_active: boolean; p_user_id: number }
        Returns: string
      }
      set_employee_policy: {
        Args: { p_policy_id: number; p_user_id: number }
        Returns: undefined
      }
      set_team_post_notice: {
        Args: { p_is_notice: boolean; p_post_id: number }
        Returns: undefined
      }
      task_json: {
        Args: { p_task: Database["public"]["Tables"]["tasks"]["Row"] }
        Returns: Json
      }
      tasks_for_date: {
        Args: { p_date?: string; p_task_list_id: number }
        Returns: Json
      }
      team_attendance_range: {
        Args: { p_from: string; p_group_id: number; p_to: string }
        Returns: Json
      }
      team_leave_calendar: {
        Args: { p_from: string; p_group_id: number; p_to: string }
        Returns: Json
      }
      team_post_group_id: { Args: { p_post_id: number }; Returns: number }
      today_kst: { Args: never; Returns: string }
      update_my_profile: {
        Args: { p_image?: string; p_nickname?: string }
        Returns: Json
      }
      update_recurring: {
        Args: {
          p_description?: string
          p_frequency_type?: string
          p_month_day?: number
          p_name?: string
          p_recurring_id: number
          p_start_date?: string
          p_week_days?: number[]
        }
        Returns: Json
      }
      update_task: {
        Args: {
          p_description?: string
          p_done?: boolean
          p_name?: string
          p_task_id: number
        }
        Returns: Json
      }
      user_history: { Args: never; Returns: Json }
      user_json: { Args: { p_user_id: number }; Returns: Json }
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
    Enums: {},
  },
} as const
