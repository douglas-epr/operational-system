export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      agency: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agreement_template: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_agreement_template_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_internal_project_message: {
        Row: {
          attachments: Json
          author_type: Database["public"]["Enums"]["os_message_author_type"]
          created_at: string
          created_by: string
          id: string
          internal_project_id: string
          links: string[]
          message: string
          updated_at: string
          viewed_by: string[]
        }
        Insert: {
          attachments?: Json
          author_type?: Database["public"]["Enums"]["os_message_author_type"]
          created_at?: string
          created_by: string
          id?: string
          internal_project_id: string
          links?: string[]
          message: string
          updated_at?: string
          viewed_by?: string[]
        }
        Update: {
          attachments?: Json
          author_type?: Database["public"]["Enums"]["os_message_author_type"]
          created_at?: string
          created_by?: string
          id?: string
          internal_project_id?: string
          links?: string[]
          message?: string
          updated_at?: string
          viewed_by?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "conversation_internal_project_message_internal_project_id_fkey"
            columns: ["internal_project_id"]
            isOneToOne: false
            referencedRelation: "internal_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_internal_project_message_owner_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_internal_project_message_emoji: {
        Row: {
          conversation_internal_project_message_id: string
          created_at: string
          created_by: string
          emoji_code: string
          id: string
        }
        Insert: {
          conversation_internal_project_message_id: string
          created_at?: string
          created_by: string
          emoji_code: string
          id?: string
        }
        Update: {
          conversation_internal_project_message_id?: string
          created_at?: string
          created_by?: string
          emoji_code?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_internal_project_conversation_internal_projec_fkey"
            columns: ["conversation_internal_project_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_internal_project_message"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_internal_project_message_emoji_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_internal_project_message_thread: {
        Row: {
          attachments: Json
          created_at: string
          created_by: string
          id: string
          internal_project_id: string
          links: string[]
          message: string
          parent_id: string
          updated_at: string
          viewed_by: string[]
        }
        Insert: {
          attachments?: Json
          created_at?: string
          created_by: string
          id?: string
          internal_project_id: string
          links?: string[]
          message: string
          parent_id: string
          updated_at?: string
          viewed_by?: string[]
        }
        Update: {
          attachments?: Json
          created_at?: string
          created_by?: string
          id?: string
          internal_project_id?: string
          links?: string[]
          message?: string
          parent_id?: string
          updated_at?: string
          viewed_by?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "conversation_internal_project_message__internal_project_id_fkey"
            columns: ["internal_project_id"]
            isOneToOne: false
            referencedRelation: "internal_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_internal_project_message_thread_owner_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_internal_project_message_thread_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "conversation_internal_project_message"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_internal_project_message_thread_emoji: {
        Row: {
          conversation_internal_project_message_thread_id: string
          created_at: string
          created_by: string
          emoji_code: string
          id: string
        }
        Insert: {
          conversation_internal_project_message_thread_id: string
          created_at?: string
          created_by: string
          emoji_code: string
          id?: string
        }
        Update: {
          conversation_internal_project_message_thread_id?: string
          created_at?: string
          created_by?: string
          emoji_code?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_internal_projec_conversation_internal_projec_fkey1"
            columns: ["conversation_internal_project_message_thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_internal_project_message_thread"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_internal_project_message_thread_em_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_private: {
        Row: {
          created_at: string
          created_by: string
          id: string
          participant_user_ids: string[]
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          participant_user_ids: string[]
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          participant_user_ids?: string[]
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      conversation_private_message: {
        Row: {
          attachments: Json
          author_type: Database["public"]["Enums"]["os_message_author_type"]
          conversation_id: string
          created_at: string
          created_by: string
          id: string
          links: string[]
          message: string
          updated_at: string
          viewed_by: string[]
        }
        Insert: {
          attachments?: Json
          author_type?: Database["public"]["Enums"]["os_message_author_type"]
          conversation_id: string
          created_at?: string
          created_by: string
          id?: string
          links?: string[]
          message: string
          updated_at?: string
          viewed_by?: string[]
        }
        Update: {
          attachments?: Json
          author_type?: Database["public"]["Enums"]["os_message_author_type"]
          conversation_id?: string
          created_at?: string
          created_by?: string
          id?: string
          links?: string[]
          message?: string
          updated_at?: string
          viewed_by?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "private_conversation_message_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_conversation_message_owner_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_private_message_emoji: {
        Row: {
          conversation_private_message_id: string
          created_at: string
          created_by: string
          emoji_code: string
          id: string
        }
        Insert: {
          conversation_private_message_id: string
          created_at?: string
          created_by: string
          emoji_code: string
          id?: string
        }
        Update: {
          conversation_private_message_id?: string
          created_at?: string
          created_by?: string
          emoji_code?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_private_message__conversation_private_message_fkey"
            columns: ["conversation_private_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_private_message"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_private_message_emoji_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_private_message_thread: {
        Row: {
          attachments: Json
          conversation_id: string
          created_at: string
          created_by: string
          id: string
          links: string[]
          message: string
          parent_id: string
          updated_at: string
          viewed_by: string[]
        }
        Insert: {
          attachments?: Json
          conversation_id: string
          created_at?: string
          created_by: string
          id?: string
          links?: string[]
          message: string
          parent_id: string
          updated_at?: string
          viewed_by?: string[]
        }
        Update: {
          attachments?: Json
          conversation_id?: string
          created_at?: string
          created_by?: string
          id?: string
          links?: string[]
          message?: string
          parent_id?: string
          updated_at?: string
          viewed_by?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "private_conversation_message_thread_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_conversation_message_thread_owner_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_conversation_message_thread_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "conversation_private_message"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_private_message_thread_emoji: {
        Row: {
          conversation_private_message_thread_id: string
          created_at: string
          created_by: string
          emoji_code: string
          id: string
        }
        Insert: {
          conversation_private_message_thread_id: string
          created_at?: string
          created_by: string
          emoji_code: string
          id?: string
        }
        Update: {
          conversation_private_message_thread_id?: string
          created_at?: string
          created_by?: string
          emoji_code?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_private_message_conversation_private_message_fkey1"
            columns: ["conversation_private_message_thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_private_message_thread"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_private_message_thread_emoji_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_project_external_message: {
        Row: {
          attachments: Json
          author_type: Database["public"]["Enums"]["os_message_author_type"]
          created_at: string
          created_by: string
          id: string
          links: string[]
          message: string
          project_id: string
          updated_at: string
          viewed_by: string[]
        }
        Insert: {
          attachments?: Json
          author_type?: Database["public"]["Enums"]["os_message_author_type"]
          created_at?: string
          created_by: string
          id?: string
          links?: string[]
          message: string
          project_id: string
          updated_at?: string
          viewed_by?: string[]
        }
        Update: {
          attachments?: Json
          author_type?: Database["public"]["Enums"]["os_message_author_type"]
          created_at?: string
          created_by?: string
          id?: string
          links?: string[]
          message?: string
          project_id?: string
          updated_at?: string
          viewed_by?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "external_conversation_project_message_owner_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_conversation_project_message_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_project_external_message_emoji: {
        Row: {
          conversation_project_external_message_id: string
          created_at: string
          created_by: string
          emoji_code: string
          id: string
        }
        Insert: {
          conversation_project_external_message_id: string
          created_at?: string
          created_by: string
          emoji_code: string
          id?: string
        }
        Update: {
          conversation_project_external_message_id?: string
          created_at?: string
          created_by?: string
          emoji_code?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_project_external_conversation_project_externa_fkey"
            columns: ["conversation_project_external_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_project_external_message"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_project_external_message_emoji_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_project_external_message_thread: {
        Row: {
          attachments: Json
          created_at: string
          created_by: string
          id: string
          links: string[]
          message: string
          parent_id: string
          project_id: string
          updated_at: string
          viewed_by: string[]
        }
        Insert: {
          attachments?: Json
          created_at?: string
          created_by: string
          id?: string
          links?: string[]
          message: string
          parent_id: string
          project_id: string
          updated_at?: string
          viewed_by?: string[]
        }
        Update: {
          attachments?: Json
          created_at?: string
          created_by?: string
          id?: string
          links?: string[]
          message?: string
          parent_id?: string
          project_id?: string
          updated_at?: string
          viewed_by?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "external_conversation_project_message_thread_owner_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_conversation_project_message_thread_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "conversation_project_external_message"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_conversation_project_message_thread_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_project_external_message_thread_emoji: {
        Row: {
          conversation_project_external_message_thread_id: string
          created_at: string
          created_by: string
          emoji_code: string
          id: string
        }
        Insert: {
          conversation_project_external_message_thread_id: string
          created_at?: string
          created_by: string
          emoji_code: string
          id?: string
        }
        Update: {
          conversation_project_external_message_thread_id?: string
          created_at?: string
          created_by?: string
          emoji_code?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_project_externa_conversation_project_externa_fkey1"
            columns: ["conversation_project_external_message_thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_project_external_message_thread"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_project_external_message_thread_em_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          created_by: string | null
          id: string
          project_id: string | null
          rating: number | null
          updated_at: string
          user_type: Database["public"]["Enums"]["os_user_type"] | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          project_id?: string | null
          rating?: number | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["os_user_type"] | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          project_id?: string | null
          rating?: number | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["os_user_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      idea: {
        Row: {
          authorized_users: string[]
          created_at: string
          created_by: string | null
          current_ai_request_id: string | null
          current_block_ended:
            | Database["public"]["Enums"]["os_idea_block"]
            | null
          current_blocks_updating: string | null
          description: string | null
          id: string
          name: string
          project_id: string | null
          score: number | null
          success_metrics: string | null
          updated_at: string
          version_name: string | null
        }
        Insert: {
          authorized_users?: string[]
          created_at?: string
          created_by?: string | null
          current_ai_request_id?: string | null
          current_block_ended?:
            | Database["public"]["Enums"]["os_idea_block"]
            | null
          current_blocks_updating?: string | null
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          score?: number | null
          success_metrics?: string | null
          updated_at?: string
          version_name?: string | null
        }
        Update: {
          authorized_users?: string[]
          created_at?: string
          created_by?: string | null
          current_ai_request_id?: string | null
          current_block_ended?:
            | Database["public"]["Enums"]["os_idea_block"]
            | null
          current_blocks_updating?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          score?: number | null
          success_metrics?: string | null
          updated_at?: string
          version_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_benchmarking: {
        Row: {
          comparison: string | null
          created_at: string
          created_by: string | null
          id: string
          idea_id: string
          overview: string | null
          possible_business_models: string | null
          takeaways: string | null
          updated_at: string
        }
        Insert: {
          comparison?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id: string
          overview?: string | null
          possible_business_models?: string | null
          takeaways?: string | null
          updated_at?: string
        }
        Update: {
          comparison?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id?: string
          overview?: string | null
          possible_business_models?: string | null
          takeaways?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_benchmarking_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_benchmarking_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: true
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_chatbot: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          idea_id: string
          message: string
          type: Database["public"]["Enums"]["os_idea_chatbot_message_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id: string
          message: string
          type: Database["public"]["Enums"]["os_idea_chatbot_message_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id?: string
          message?: string
          type?: Database["public"]["Enums"]["os_idea_chatbot_message_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_chatbot_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_chatbot_devil_advocate: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          idea_id: string
          message: string
          type: Database["public"]["Enums"]["os_idea_chatbot_message_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id: string
          message: string
          type: Database["public"]["Enums"]["os_idea_chatbot_message_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id?: string
          message?: string
          type?: Database["public"]["Enums"]["os_idea_chatbot_message_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_chatbot_devil_advocate_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_database: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          idea_id: string
          notes: string | null
          relationships: string | null
          tables_schema: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id: string
          notes?: string | null
          relationships?: string | null
          tables_schema?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id?: string
          notes?: string | null
          relationships?: string | null
          tables_schema?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_database_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_database_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: true
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_icp: {
        Row: {
          created_at: string
          created_by: string | null
          day_in_life: string | null
          description: string | null
          firmographics: string | null
          how_problems_are_solved: string | null
          how_problems_could_be_solved: string | null
          id: string
          idea_id: string | null
          jtbd: string | null
          name: string | null
          our_solution_value: string | null
          pain_points: string | null
          picture: string | null
          pitch_approach: string | null
          pitch_benefit: string | null
          pitch_competition: string | null
          pitch_need: string | null
          psychographics: string | null
          score: number | null
          score_rationale: string | null
          subtitle: string | null
          tags: string[]
          title: string | null
          updated_at: string
          value_proposition_icp_gains: string | null
          value_proposition_icp_pains: string | null
          value_proposition_value_map_gain_creators: string | null
          value_proposition_value_map_solutions: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          day_in_life?: string | null
          description?: string | null
          firmographics?: string | null
          how_problems_are_solved?: string | null
          how_problems_could_be_solved?: string | null
          id?: string
          idea_id?: string | null
          jtbd?: string | null
          name?: string | null
          our_solution_value?: string | null
          pain_points?: string | null
          picture?: string | null
          pitch_approach?: string | null
          pitch_benefit?: string | null
          pitch_competition?: string | null
          pitch_need?: string | null
          psychographics?: string | null
          score?: number | null
          score_rationale?: string | null
          subtitle?: string | null
          tags?: string[]
          title?: string | null
          updated_at?: string
          value_proposition_icp_gains?: string | null
          value_proposition_icp_pains?: string | null
          value_proposition_value_map_gain_creators?: string | null
          value_proposition_value_map_solutions?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          day_in_life?: string | null
          description?: string | null
          firmographics?: string | null
          how_problems_are_solved?: string | null
          how_problems_could_be_solved?: string | null
          id?: string
          idea_id?: string | null
          jtbd?: string | null
          name?: string | null
          our_solution_value?: string | null
          pain_points?: string | null
          picture?: string | null
          pitch_approach?: string | null
          pitch_benefit?: string | null
          pitch_competition?: string | null
          pitch_need?: string | null
          psychographics?: string | null
          score?: number | null
          score_rationale?: string | null
          subtitle?: string | null
          tags?: string[]
          title?: string | null
          updated_at?: string
          value_proposition_icp_gains?: string | null
          value_proposition_icp_pains?: string | null
          value_proposition_value_map_gain_creators?: string | null
          value_proposition_value_map_solutions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_icp_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_icp_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_milestones_and_tasks: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          idea_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_milestones_and_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_milestones_and_tasks_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: true
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_optimization_suggestion: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          icp_id: string | null
          id: string
          idea_id: string | null
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icp_id?: string | null
          id?: string
          idea_id?: string | null
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icp_id?: string | null
          id?: string
          idea_id?: string | null
          name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_optimization_suggestion_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_optimization_suggestion_icp_id_fkey"
            columns: ["icp_id"]
            isOneToOne: false
            referencedRelation: "idea_icp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_optimization_suggestion_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_playbook_comment: {
        Row: {
          attachments: Json
          created_at: string
          created_by: string
          id: string
          idea_id: string | null
          message: string | null
          playbook_id: string
          status: Database["public"]["Enums"]["os_playbook_comment_status"]
          updated_at: string
          viewed_by: string[]
        }
        Insert: {
          attachments?: Json
          created_at?: string
          created_by: string
          id?: string
          idea_id?: string | null
          message?: string | null
          playbook_id: string
          status?: Database["public"]["Enums"]["os_playbook_comment_status"]
          updated_at?: string
          viewed_by?: string[]
        }
        Update: {
          attachments?: Json
          created_at?: string
          created_by?: string
          id?: string
          idea_id?: string | null
          message?: string | null
          playbook_id?: string
          status?: Database["public"]["Enums"]["os_playbook_comment_status"]
          updated_at?: string
          viewed_by?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "project_playbook_comment_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_playbook_comment_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_playbook_comment_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "idea_playbook_version"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_playbook_comment_reply: {
        Row: {
          attachments: Json
          created_at: string
          created_by: string
          id: string
          idea_id: string | null
          idea_playbook_comment_id: string
          message: string | null
          playbook_id: string
          updated_at: string
          viewed_by: string[]
        }
        Insert: {
          attachments?: Json
          created_at?: string
          created_by: string
          id?: string
          idea_id?: string | null
          idea_playbook_comment_id: string
          message?: string | null
          playbook_id: string
          updated_at?: string
          viewed_by?: string[]
        }
        Update: {
          attachments?: Json
          created_at?: string
          created_by?: string
          id?: string
          idea_id?: string | null
          idea_playbook_comment_id?: string
          message?: string | null
          playbook_id?: string
          updated_at?: string
          viewed_by?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "project_playbook_comment_reply_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_playbook_comment_reply_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_playbook_comment_reply_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "idea_playbook_version"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_playbook_comment_reply_project_playbook_comment_id_fkey"
            columns: ["idea_playbook_comment_id"]
            isOneToOne: false
            referencedRelation: "idea_playbook_comment"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_playbook_version: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          google_docs_url: string | null
          id: string
          idea_id: string | null
          updated_at: string
          version_name: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          google_docs_url?: string | null
          id?: string
          idea_id?: string | null
          updated_at?: string
          version_name?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          google_docs_url?: string | null
          id?: string
          idea_id?: string | null
          updated_at?: string
          version_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_playbook_version_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_playbook_version_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_prd: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          idea_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          idea_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          idea_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_prd_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_prd_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: true
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_product_definition_and_flows: {
        Row: {
          business_model: string | null
          created_at: string
          created_by: string | null
          features: string | null
          go_to_market: string | null
          id: string
          idea_id: string | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          business_model?: string | null
          created_at?: string
          created_by?: string | null
          features?: string | null
          go_to_market?: string | null
          id?: string
          idea_id?: string | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          business_model?: string | null
          created_at?: string
          created_by?: string | null
          features?: string | null
          go_to_market?: string | null
          id?: string
          idea_id?: string | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_block_product_definition_and_flows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_block_product_definition_and_flows_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_report: {
        Row: {
          agreed_problem: string | null
          agreed_solution: string | null
          alignment: Json | null
          area_scores: Json | null
          completeness_score: number | null
          created_at: string
          debate_meta: Json | null
          debate_transcript: Json | null
          final_score: number | null
          headline: string | null
          id: string
          idea_id: string
          next_steps: string | null
          penalties: Json | null
          playbook_html: string | null
          playbook_subtitle: string | null
          playbook_title: string | null
          recommendation: string | null
          revised_description: string | null
          summary: string | null
          threshold_bucket: string | null
          updated_at: string
        }
        Insert: {
          agreed_problem?: string | null
          agreed_solution?: string | null
          alignment?: Json | null
          area_scores?: Json | null
          completeness_score?: number | null
          created_at?: string
          debate_meta?: Json | null
          debate_transcript?: Json | null
          final_score?: number | null
          headline?: string | null
          id?: string
          idea_id: string
          next_steps?: string | null
          penalties?: Json | null
          playbook_html?: string | null
          playbook_subtitle?: string | null
          playbook_title?: string | null
          recommendation?: string | null
          revised_description?: string | null
          summary?: string | null
          threshold_bucket?: string | null
          updated_at?: string
        }
        Update: {
          agreed_problem?: string | null
          agreed_solution?: string | null
          alignment?: Json | null
          area_scores?: Json | null
          completeness_score?: number | null
          created_at?: string
          debate_meta?: Json | null
          debate_transcript?: Json | null
          final_score?: number | null
          headline?: string | null
          id?: string
          idea_id?: string
          next_steps?: string | null
          penalties?: Json | null
          playbook_html?: string | null
          playbook_subtitle?: string | null
          playbook_title?: string | null
          recommendation?: string | null
          revised_description?: string | null
          summary?: string | null
          threshold_bucket?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_report_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: true
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_structure_and_align: {
        Row: {
          core_problem: string | null
          created_at: string
          created_by: string | null
          essential_features_text: string | null
          id: string
          idea_id: string | null
          product_overview_text: string | null
          success_metrics: string | null
          success_metrics_text: string | null
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          core_problem?: string | null
          created_at?: string
          created_by?: string | null
          essential_features_text?: string | null
          id?: string
          idea_id?: string | null
          product_overview_text?: string | null
          success_metrics?: string | null
          success_metrics_text?: string | null
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          core_problem?: string | null
          created_at?: string
          created_by?: string | null
          essential_features_text?: string | null
          id?: string
          idea_id?: string | null
          product_overview_text?: string | null
          success_metrics?: string | null
          success_metrics_text?: string | null
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_block_structure_and_align_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_structure_and_align_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_styles: {
        Row: {
          accent_color: string | null
          border_radius: Json | null
          brand_voice: string | null
          color_palette: string | null
          color_tokens: Json | null
          created_at: string
          created_by: string | null
          iconography_style: string | null
          id: string
          idea_id: string
          logo_branding: string | null
          motion_principles: string | null
          neutral_color: string | null
          primary_color: string | null
          product_feeling: string | null
          secondary_color: string | null
          shadows: Json | null
          spacing: Json | null
          typography: Json | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          border_radius?: Json | null
          brand_voice?: string | null
          color_palette?: string | null
          color_tokens?: Json | null
          created_at?: string
          created_by?: string | null
          iconography_style?: string | null
          id?: string
          idea_id: string
          logo_branding?: string | null
          motion_principles?: string | null
          neutral_color?: string | null
          primary_color?: string | null
          product_feeling?: string | null
          secondary_color?: string | null
          shadows?: Json | null
          spacing?: Json | null
          typography?: Json | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          border_radius?: Json | null
          brand_voice?: string | null
          color_palette?: string | null
          color_tokens?: Json | null
          created_at?: string
          created_by?: string | null
          iconography_style?: string | null
          id?: string
          idea_id?: string
          logo_branding?: string | null
          motion_principles?: string | null
          neutral_color?: string | null
          primary_color?: string | null
          product_feeling?: string | null
          secondary_color?: string | null
          shadows?: Json | null
          spacing?: Json | null
          typography?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_styles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_styles_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: true
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_goal: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string | null
          order: number | null
          status: Database["public"]["Enums"]["os_internal_goals_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string | null
          order?: number | null
          status?: Database["public"]["Enums"]["os_internal_goals_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string | null
          order?: number | null
          status?: Database["public"]["Enums"]["os_internal_goals_status"]
          updated_at?: string
        }
        Relationships: []
      }
      internal_key_result: {
        Row: {
          achieved: boolean
          created_at: string
          created_by: string | null
          current_key_result_value: number | null
          description: string | null
          end_date: string | null
          id: string
          internal_goal_id: string | null
          name: string | null
          order: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["os_internal_key_result_status"]
          updated_at: string
        }
        Insert: {
          achieved?: boolean
          created_at?: string
          created_by?: string | null
          current_key_result_value?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          internal_goal_id?: string | null
          name?: string | null
          order?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["os_internal_key_result_status"]
          updated_at?: string
        }
        Update: {
          achieved?: boolean
          created_at?: string
          created_by?: string | null
          current_key_result_value?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          internal_goal_id?: string | null
          name?: string | null
          order?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["os_internal_key_result_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_key_result_internal_goal_id_fkey"
            columns: ["internal_goal_id"]
            isOneToOne: false
            referencedRelation: "internal_goal"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_key_result_track: {
        Row: {
          achieved: boolean
          created_at: string
          created_by: string | null
          current_target_key_result_value: number | null
          date: string
          id: string
          internal_goal_id: string | null
          internal_key_result_id: string | null
          value: number | null
        }
        Insert: {
          achieved?: boolean
          created_at?: string
          created_by?: string | null
          current_target_key_result_value?: number | null
          date: string
          id?: string
          internal_goal_id?: string | null
          internal_key_result_id?: string | null
          value?: number | null
        }
        Update: {
          achieved?: boolean
          created_at?: string
          created_by?: string | null
          current_target_key_result_value?: number | null
          date?: string
          id?: string
          internal_goal_id?: string | null
          internal_key_result_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_key_result_track_internal_goal_id_fkey"
            columns: ["internal_goal_id"]
            isOneToOne: false
            referencedRelation: "internal_goal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_key_result_track_internal_key_result_id_fkey"
            columns: ["internal_key_result_id"]
            isOneToOne: false
            referencedRelation: "internal_key_result"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_project: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date_estimated: string | null
          end_date_real: string | null
          estimated_time: number | null
          id: string
          internal_key_result_ids: string[]
          name: string
          order: number | null
          real_time: number | null
          sector: Database["public"]["Enums"]["os_company_sector"] | null
          start_date_estimated: string | null
          start_date_real: string | null
          status: Database["public"]["Enums"]["os_internal_project_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date_estimated?: string | null
          end_date_real?: string | null
          estimated_time?: number | null
          id?: string
          internal_key_result_ids?: string[]
          name: string
          order?: number | null
          real_time?: number | null
          sector?: Database["public"]["Enums"]["os_company_sector"] | null
          start_date_estimated?: string | null
          start_date_real?: string | null
          status?: Database["public"]["Enums"]["os_internal_project_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date_estimated?: string | null
          end_date_real?: string | null
          estimated_time?: number | null
          id?: string
          internal_key_result_ids?: string[]
          name?: string
          order?: number | null
          real_time?: number | null
          sector?: Database["public"]["Enums"]["os_company_sector"] | null
          start_date_estimated?: string | null
          start_date_real?: string | null
          status?: Database["public"]["Enums"]["os_internal_project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_project_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_project_assignees: {
        Row: {
          internal_project_id: string
          user_id: string
        }
        Insert: {
          internal_project_id: string
          user_id: string
        }
        Update: {
          internal_project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_project_assignees_internal_project_id_fkey"
            columns: ["internal_project_id"]
            isOneToOne: false
            referencedRelation: "internal_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_project_assignees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_project_work_feedback: {
        Row: {
          blockers: string | null
          created_at: string
          created_by: string
          current_work: string | null
          date: string
          end_date: string | null
          id: string
          internal_project_id: string
          next_work: string | null
          start_date: string | null
          total_time: number | null
          updated_at: string
          video_and_links: string | null
        }
        Insert: {
          blockers?: string | null
          created_at?: string
          created_by: string
          current_work?: string | null
          date: string
          end_date?: string | null
          id?: string
          internal_project_id: string
          next_work?: string | null
          start_date?: string | null
          total_time?: number | null
          updated_at?: string
          video_and_links?: string | null
        }
        Update: {
          blockers?: string | null
          created_at?: string
          created_by?: string
          current_work?: string | null
          date?: string
          end_date?: string | null
          id?: string
          internal_project_id?: string
          next_work?: string | null
          start_date?: string | null
          total_time?: number | null
          updated_at?: string
          video_and_links?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_project_daily_feedback_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_project_daily_feedback_internal_project_id_fkey"
            columns: ["internal_project_id"]
            isOneToOne: false
            referencedRelation: "internal_project"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_project_file: {
        Row: {
          attachments: Json
          created_at: string
          created_by: string
          description: string | null
          id: string
          internal_project_id: string
          name: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          internal_project_id: string
          name: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          internal_project_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_project_file_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_project_file_internal_project_id_fkey"
            columns: ["internal_project_id"]
            isOneToOne: false
            referencedRelation: "internal_project"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_project_link: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          internal_project_id: string
          name: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          internal_project_id: string
          name: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          internal_project_id?: string
          name?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_project_link_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_project_link_internal_project_id_fkey"
            columns: ["internal_project_id"]
            isOneToOne: false
            referencedRelation: "internal_project"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_project_task: {
        Row: {
          assignees: string[]
          created_at: string
          created_by: string | null
          description: string | null
          estimated_end_date: string | null
          estimated_start_date: string | null
          estimated_time: number | null
          id: string
          internal_goal_id: string | null
          internal_key_result_id: string | null
          internal_project_id: string | null
          name: string
          order: number | null
          real_end_date: string | null
          real_start_date: string | null
          real_time: number | null
          status: Database["public"]["Enums"]["os_internal_task_status"]
          updated_at: string
        }
        Insert: {
          assignees?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_end_date?: string | null
          estimated_start_date?: string | null
          estimated_time?: number | null
          id?: string
          internal_goal_id?: string | null
          internal_key_result_id?: string | null
          internal_project_id?: string | null
          name: string
          order?: number | null
          real_end_date?: string | null
          real_start_date?: string | null
          real_time?: number | null
          status?: Database["public"]["Enums"]["os_internal_task_status"]
          updated_at?: string
        }
        Update: {
          assignees?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_end_date?: string | null
          estimated_start_date?: string | null
          estimated_time?: number | null
          id?: string
          internal_goal_id?: string | null
          internal_key_result_id?: string | null
          internal_project_id?: string | null
          name?: string
          order?: number | null
          real_end_date?: string | null
          real_start_date?: string | null
          real_time?: number | null
          status?: Database["public"]["Enums"]["os_internal_task_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_task_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_task_internal_goal_id_fkey"
            columns: ["internal_goal_id"]
            isOneToOne: false
            referencedRelation: "internal_goal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_task_internal_key_result_id_fkey"
            columns: ["internal_key_result_id"]
            isOneToOne: false
            referencedRelation: "internal_key_result"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_task_internal_project_id_fkey"
            columns: ["internal_project_id"]
            isOneToOne: false
            referencedRelation: "internal_project"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_project_task_comment: {
        Row: {
          attachments: Json
          authorized_users: string[]
          created_at: string
          created_by: string
          id: string
          internal_project_id: string | null
          internal_task_id: string
          message: string | null
          updated_at: string
          viewed_by: string[]
        }
        Insert: {
          attachments?: Json
          authorized_users?: string[]
          created_at?: string
          created_by: string
          id?: string
          internal_project_id?: string | null
          internal_task_id: string
          message?: string | null
          updated_at?: string
          viewed_by?: string[]
        }
        Update: {
          attachments?: Json
          authorized_users?: string[]
          created_at?: string
          created_by?: string
          id?: string
          internal_project_id?: string | null
          internal_task_id?: string
          message?: string | null
          updated_at?: string
          viewed_by?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "internal_task_comment_internal_project_id_fkey"
            columns: ["internal_project_id"]
            isOneToOne: false
            referencedRelation: "internal_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_task_comment_internal_task_id_fkey"
            columns: ["internal_task_id"]
            isOneToOne: false
            referencedRelation: "internal_project_task"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_task_comment_owner_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_project_task_time_track: {
        Row: {
          assignee_id: string
          created_at: string
          created_by: string | null
          end_time_min: number | null
          id: string
          internal_project_id: string | null
          internal_task_id: string | null
          start_date: string | null
          start_time_min: number | null
          time_spent_h: number | null
          updated_at: string
        }
        Insert: {
          assignee_id: string
          created_at?: string
          created_by?: string | null
          end_time_min?: number | null
          id?: string
          internal_project_id?: string | null
          internal_task_id?: string | null
          start_date?: string | null
          start_time_min?: number | null
          time_spent_h?: number | null
          updated_at?: string
        }
        Update: {
          assignee_id?: string
          created_at?: string
          created_by?: string | null
          end_time_min?: number | null
          id?: string
          internal_project_id?: string | null
          internal_task_id?: string | null
          start_date?: string | null
          start_time_min?: number | null
          time_spent_h?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_task_time_track_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_time_track_internal_project_id_fkey"
            columns: ["internal_project_id"]
            isOneToOne: false
            referencedRelation: "internal_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_time_track_internal_task_id_fkey"
            columns: ["internal_task_id"]
            isOneToOne: false
            referencedRelation: "internal_project_task"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_time_track_owner_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_project_video: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          internal_project_id: string
          name: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          internal_project_id: string
          name?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          internal_project_id?: string
          name?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_project_video_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_project_video_internal_project_id_fkey"
            columns: ["internal_project_id"]
            isOneToOne: false
            referencedRelation: "internal_project"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice: {
        Row: {
          account_details: string | null
          address: string | null
          client_name: string | null
          code: string
          currency: string | null
          company_or_user_name: string | null
          created_at: string
          created_by: string
          document_number: string | null
          due_date: string | null
          email: string | null
          end_date: string | null
          iban_code: string | null
          id: string
          phone: string | null
          service_description: string | null
          service_price: number | null
          service_title: string | null
          start_date: string | null
          swift_code: string | null
          total_time: number | null
          updated_at: string
        }
        Insert: {
          account_details?: string | null
          address?: string | null
          client_name?: string | null
          code: string
          company_or_user_name?: string | null
          created_at?: string
          created_by: string
          currency?: string | null
          document_number?: string | null
          due_date?: string | null
          email?: string | null
          end_date?: string | null
          iban_code?: string | null
          id?: string
          phone?: string | null
          service_description?: string | null
          service_price?: number | null
          service_title?: string | null
          start_date?: string | null
          swift_code?: string | null
          total_time?: number | null
          updated_at?: string
        }
        Update: {
          account_details?: string | null
          address?: string | null
          client_name?: string | null
          code?: string
          company_or_user_name?: string | null
          created_at?: string
          created_by?: string
          currency?: string | null
          document_number?: string | null
          due_date?: string | null
          email?: string | null
          end_date?: string | null
          iban_code?: string | null
          id?: string
          phone?: string | null
          service_description?: string | null
          service_price?: number | null
          service_title?: string | null
          start_date?: string | null
          swift_code?: string | null
          total_time?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invoice_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_ad_campaign: {
        Row: {
          ad_creative: Json
          budget_cents: number
          created_at: string
          created_by: string | null
          ended_at: string | null
          id: string
          idea_id: string
          landing_id: string | null
          name: string
          platform: string
          spend_cents: number
          started_at: string | null
          status: string
          targeting_notes: string | null
          updated_at: string
          utm_campaign: string
        }
        Insert: {
          ad_creative?: Json
          budget_cents?: number
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          idea_id: string
          landing_id?: string | null
          name: string
          platform: string
          spend_cents?: number
          started_at?: string | null
          status?: string
          targeting_notes?: string | null
          updated_at?: string
          utm_campaign: string
        }
        Update: {
          ad_creative?: Json
          budget_cents?: number
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          idea_id?: string
          landing_id?: string | null
          name?: string
          platform?: string
          spend_cents?: number
          started_at?: string | null
          status?: string
          targeting_notes?: string | null
          updated_at?: string
          utm_campaign?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_ad_campaign_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mkt_ad_campaign_landing_id_fkey"
            columns: ["landing_id"]
            isOneToOne: false
            referencedRelation: "mkt_landing"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_campaign: {
        Row: {
          channel: Database["public"]["Enums"]["mkt_channel"]
          created_at: string
          created_by: string | null
          id: string
          idea_id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["mkt_channel"]
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["mkt_channel"]
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_campaign_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_content: {
        Row: {
          ai_generated: boolean
          body: string | null
          channels: string[]
          created_at: string
          created_by: string | null
          external_post_ids: Json
          id: string
          idea_id: string
          media_url: string | null
          media_urls: string[]
          posted_at: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["mkt_content_status"]
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean
          body?: string | null
          channels?: string[]
          created_at?: string
          created_by?: string | null
          external_post_ids?: Json
          id?: string
          idea_id: string
          media_url?: string | null
          media_urls?: string[]
          posted_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["mkt_content_status"]
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean
          body?: string | null
          channels?: string[]
          created_at?: string
          created_by?: string | null
          external_post_ids?: Json
          id?: string
          idea_id?: string
          media_url?: string | null
          media_urls?: string[]
          posted_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["mkt_content_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_content_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_decision_log: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          idea_id: string
          metrics_snapshot: Json
          rationale: string
          verdict: Database["public"]["Enums"]["mkt_validation_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id: string
          metrics_snapshot?: Json
          rationale: string
          verdict: Database["public"]["Enums"]["mkt_validation_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id?: string
          metrics_snapshot?: Json
          rationale?: string
          verdict?: Database["public"]["Enums"]["mkt_validation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "mkt_decision_log_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_event: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          landing_id: string | null
          session_id: string | null
          type: string
          utm: Json
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          landing_id?: string | null
          session_id?: string | null
          type: string
          utm?: Json
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          landing_id?: string | null
          session_id?: string | null
          type?: string
          utm?: Json
        }
        Relationships: [
          {
            foreignKeyName: "mkt_event_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mkt_event_landing_id_fkey"
            columns: ["landing_id"]
            isOneToOne: false
            referencedRelation: "mkt_landing"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_interview: {
        Row: {
          analysis: Json
          analyzed_at: string | null
          conducted_at: string | null
          consent: boolean
          created_at: string
          created_by: string | null
          id: string
          idea_id: string
          participant_name: string | null
          participant_role: string | null
          prospect_id: string | null
          recording_url: string | null
          segment: string | null
          source: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          analysis?: Json
          analyzed_at?: string | null
          conducted_at?: string | null
          consent?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id: string
          participant_name?: string | null
          participant_role?: string | null
          prospect_id?: string | null
          recording_url?: string | null
          segment?: string | null
          source?: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          analysis?: Json
          analyzed_at?: string | null
          conducted_at?: string | null
          consent?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id?: string
          participant_name?: string | null
          participant_role?: string | null
          prospect_id?: string | null
          recording_url?: string | null
          segment?: string | null
          source?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_interview_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mkt_interview_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "mkt_prospect"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_landing: {
        Row: {
          capture_stages: string[]
          code_html: string | null
          created_at: string
          created_by: string | null
          id: string
          idea_id: string
          published: boolean
          quiz_schema: Json
          slug: string
          survey_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          capture_stages?: string[]
          code_html?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id: string
          published?: boolean
          quiz_schema?: Json
          slug: string
          survey_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          capture_stages?: string[]
          code_html?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id?: string
          published?: boolean
          quiz_schema?: Json
          slug?: string
          survey_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_landing_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_outreach: {
        Row: {
          brevo_message_id: string | null
          campaign_id: string
          created_at: string
          id: string
          idea_id: string
          opened_at: string | null
          prospect_id: string
          replied_at: string | null
          reply_sentiment: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["mkt_outreach_status"]
          step_order: number
          updated_at: string
        }
        Insert: {
          brevo_message_id?: string | null
          campaign_id: string
          created_at?: string
          id?: string
          idea_id: string
          opened_at?: string | null
          prospect_id: string
          replied_at?: string | null
          reply_sentiment?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["mkt_outreach_status"]
          step_order?: number
          updated_at?: string
        }
        Update: {
          brevo_message_id?: string | null
          campaign_id?: string
          created_at?: string
          id?: string
          idea_id?: string
          opened_at?: string | null
          prospect_id?: string
          replied_at?: string | null
          reply_sentiment?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["mkt_outreach_status"]
          step_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_outreach_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mkt_campaign"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mkt_outreach_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mkt_outreach_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "mkt_prospect"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_prospect: {
        Row: {
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          enrichment: Json
          id: string
          idea_id: string
          linkedin_url: string | null
          name: string | null
          score: number | null
          segment: string | null
          source: string | null
          source_run_id: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          enrichment?: Json
          id?: string
          idea_id: string
          linkedin_url?: string | null
          name?: string | null
          score?: number | null
          segment?: string | null
          source?: string | null
          source_run_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          enrichment?: Json
          id?: string
          idea_id?: string
          linkedin_url?: string | null
          name?: string | null
          score?: number | null
          segment?: string | null
          source?: string | null
          source_run_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_prospect_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mkt_prospect_source_run_id_fkey"
            columns: ["source_run_id"]
            isOneToOne: false
            referencedRelation: "mkt_source_run"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_research_cache: {
        Row: {
          digest: string
          id: string
          idea_id: string
          raw: Json
          scraped_at: string
          source_key: string
        }
        Insert: {
          digest?: string
          id?: string
          idea_id: string
          raw?: Json
          scraped_at?: string
          source_key: string
        }
        Update: {
          digest?: string
          id?: string
          idea_id?: string
          raw?: Json
          scraped_at?: string
          source_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_research_cache_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_sequence_step: {
        Row: {
          ai_personalise: boolean
          body_tpl: string | null
          campaign_id: string
          created_at: string
          delay_days: number
          id: string
          idea_id: string
          step_order: number
          subject_tpl: string | null
          updated_at: string
        }
        Insert: {
          ai_personalise?: boolean
          body_tpl?: string | null
          campaign_id: string
          created_at?: string
          delay_days?: number
          id?: string
          idea_id: string
          step_order?: number
          subject_tpl?: string | null
          updated_at?: string
        }
        Update: {
          ai_personalise?: boolean
          body_tpl?: string | null
          campaign_id?: string
          created_at?: string
          delay_days?: number
          id?: string
          idea_id?: string
          step_order?: number
          subject_tpl?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_sequence_step_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mkt_campaign"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mkt_sequence_step_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_signal: {
        Row: {
          amount_cents: number | null
          created_at: string
          email: string | null
          icp_fit: boolean | null
          id: string
          idea_id: string
          landing_id: string | null
          name: string | null
          quiz_answers: Json
          stripe_session_id: string | null
          survey_answers: Json
          type: Database["public"]["Enums"]["mkt_signal_type"]
          utm: Json
          verified_at: string | null
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          email?: string | null
          icp_fit?: boolean | null
          id?: string
          idea_id: string
          landing_id?: string | null
          name?: string | null
          quiz_answers?: Json
          stripe_session_id?: string | null
          survey_answers?: Json
          type: Database["public"]["Enums"]["mkt_signal_type"]
          utm?: Json
          verified_at?: string | null
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          email?: string | null
          icp_fit?: boolean | null
          id?: string
          idea_id?: string
          landing_id?: string | null
          name?: string | null
          quiz_answers?: Json
          stripe_session_id?: string | null
          survey_answers?: Json
          type?: Database["public"]["Enums"]["mkt_signal_type"]
          utm?: Json
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mkt_signal_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mkt_signal_landing_id_fkey"
            columns: ["landing_id"]
            isOneToOne: false
            referencedRelation: "mkt_landing"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_source_run: {
        Row: {
          apify_dataset_ref: string | null
          channel: Database["public"]["Enums"]["mkt_channel"]
          created_at: string
          created_by: string | null
          id: string
          idea_id: string
          query: Json
          result_count: number
          status: string
          updated_at: string
        }
        Insert: {
          apify_dataset_ref?: string | null
          channel: Database["public"]["Enums"]["mkt_channel"]
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id: string
          query?: Json
          result_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          apify_dataset_ref?: string | null
          channel?: Database["public"]["Enums"]["mkt_channel"]
          created_at?: string
          created_by?: string | null
          id?: string
          idea_id?: string
          query?: Json
          result_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_source_run_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_suppression: {
        Row: {
          created_at: string
          email: string
          id: string
          idea_id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          idea_id: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          idea_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mkt_suppression_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      mkt_validation: {
        Row: {
          booking_url: string | null
          created_at: string
          created_by: string | null
          decision_contract: Json
          enabled_capture_stages: string[]
          funnel_mode: Database["public"]["Enums"]["mkt_funnel_mode"]
          icp_definition: Json
          id: string
          idea_id: string
          positioning: string | null
          reference_sources: Json
          status: Database["public"]["Enums"]["mkt_validation_status"]
          updated_at: string
        }
        Insert: {
          booking_url?: string | null
          created_at?: string
          created_by?: string | null
          decision_contract?: Json
          enabled_capture_stages?: string[]
          funnel_mode?: Database["public"]["Enums"]["mkt_funnel_mode"]
          icp_definition?: Json
          id?: string
          idea_id: string
          positioning?: string | null
          reference_sources?: Json
          status?: Database["public"]["Enums"]["mkt_validation_status"]
          updated_at?: string
        }
        Update: {
          booking_url?: string | null
          created_at?: string
          created_by?: string | null
          decision_contract?: Json
          enabled_capture_stages?: string[]
          funnel_mode?: Database["public"]["Enums"]["mkt_funnel_mode"]
          icp_definition?: Json
          id?: string
          idea_id?: string
          positioning?: string | null
          reference_sources?: Json
          status?: Database["public"]["Enums"]["mkt_validation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mkt_validation_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: true
            referencedRelation: "idea"
            referencedColumns: ["id"]
          },
        ]
      }
      private_chatbot: {
        Row: {
          created_at: string
          created_by: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      private_chatbot_message: {
        Row: {
          author_type: Database["public"]["Enums"]["os_message_author_type"]
          chatbot_id: string
          created_at: string
          created_by: string | null
          id: string
          message: string
          tool_calls: Json | null
          updated_at: string
        }
        Insert: {
          author_type: Database["public"]["Enums"]["os_message_author_type"]
          chatbot_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          tool_calls?: Json | null
          updated_at?: string
        }
        Update: {
          author_type?: Database["public"]["Enums"]["os_message_author_type"]
          chatbot_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          tool_calls?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_chatbot_message_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "private_chatbot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_chatbot_message_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          picture: string | null
          signature: string | null
          theme: Database["public"]["Enums"]["os_theme_choice"]
          type: Database["public"]["Enums"]["os_user_type"] | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          picture?: string | null
          signature?: string | null
          theme?: Database["public"]["Enums"]["os_theme_choice"]
          type?: Database["public"]["Enums"]["os_user_type"] | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          picture?: string | null
          signature?: string | null
          theme?: Database["public"]["Enums"]["os_theme_choice"]
          type?: Database["public"]["Enums"]["os_user_type"] | null
          updated_at?: string
        }
        Relationships: []
      }
      project: {
        Row: {
          authorized_users: string[]
          change_automatically_milestone_estimated_time: boolean
          change_automatically_milestone_start_end_dates: boolean
          change_automatically_project_estimated_time: boolean
          change_automatically_project_start_end_dates: boolean
          created_at: string
          created_by: string | null
          description: string | null
          end_date_estimated: string | null
          end_date_real: string | null
          estimated_time: number | null
          external_conversation_authorized_users: string[]
          general_requests_estimated_time: number | null
          general_requests_real_time: number | null
          id: string
          name: string | null
          picture: string | null
          real_time: number | null
          start_date_estimated: string | null
          start_date_real: string | null
          status: Database["public"]["Enums"]["os_project_status"]
          updated_at: string
        }
        Insert: {
          authorized_users?: string[]
          change_automatically_milestone_estimated_time?: boolean
          change_automatically_milestone_start_end_dates?: boolean
          change_automatically_project_estimated_time?: boolean
          change_automatically_project_start_end_dates?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date_estimated?: string | null
          end_date_real?: string | null
          estimated_time?: number | null
          external_conversation_authorized_users?: string[]
          general_requests_estimated_time?: number | null
          general_requests_real_time?: number | null
          id?: string
          name?: string | null
          picture?: string | null
          real_time?: number | null
          start_date_estimated?: string | null
          start_date_real?: string | null
          status?: Database["public"]["Enums"]["os_project_status"]
          updated_at?: string
        }
        Update: {
          authorized_users?: string[]
          change_automatically_milestone_estimated_time?: boolean
          change_automatically_milestone_start_end_dates?: boolean
          change_automatically_project_estimated_time?: boolean
          change_automatically_project_start_end_dates?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date_estimated?: string | null
          end_date_real?: string | null
          estimated_time?: number | null
          external_conversation_authorized_users?: string[]
          general_requests_estimated_time?: number | null
          general_requests_real_time?: number | null
          id?: string
          name?: string | null
          picture?: string | null
          real_time?: number | null
          start_date_estimated?: string | null
          start_date_real?: string | null
          status?: Database["public"]["Enums"]["os_project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_agreement_version: {
        Row: {
          authorized_users: string[]
          content: string | null
          created_at: string
          created_by: string
          google_docs_url: string | null
          id: string
          name: string | null
          project_id: string | null
          required_signers: string[]
          signed_by: string[]
          status: Database["public"]["Enums"]["os_agreement_status"]
          type: string | null
          updated_at: string
        }
        Insert: {
          authorized_users?: string[]
          content?: string | null
          created_at?: string
          created_by: string
          google_docs_url?: string | null
          id?: string
          name?: string | null
          project_id?: string | null
          required_signers?: string[]
          signed_by?: string[]
          status?: Database["public"]["Enums"]["os_agreement_status"]
          type?: string | null
          updated_at?: string
        }
        Update: {
          authorized_users?: string[]
          content?: string | null
          created_at?: string
          created_by?: string
          google_docs_url?: string | null
          id?: string
          name?: string | null
          project_id?: string | null
          required_signers?: string[]
          signed_by?: string[]
          status?: Database["public"]["Enums"]["os_agreement_status"]
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_agreement_version_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_agreement_version_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_agreement_version_type_fkey"
            columns: ["type"]
            isOneToOne: false
            referencedRelation: "agreement_template"
            referencedColumns: ["id"]
          },
        ]
      }
      project_chatbot_message: {
        Row: {
          attachments: Json
          author_type: Database["public"]["Enums"]["os_message_author_type"]
          created_at: string
          created_by: string | null
          id: string
          message: string | null
          project_id: string
          tool_calls: Json | null
          updated_at: string
        }
        Insert: {
          attachments?: Json
          author_type?: Database["public"]["Enums"]["os_message_author_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string | null
          project_id: string
          tool_calls?: Json | null
          updated_at?: string
        }
        Update: {
          attachments?: Json
          author_type?: Database["public"]["Enums"]["os_message_author_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string | null
          project_id?: string
          tool_calls?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_chatbot_message_owner_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_chatbot_message_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      project_work_feedback: {
        Row: {
          blockers: string | null
          created_at: string
          created_by: string
          current_work: string | null
          date: string
          end_date: string | null
          id: string
          next_work: string | null
          project_id: string | null
          start_date: string | null
          total_time: number | null
          updated_at: string
          video_and_links: string | null
        }
        Insert: {
          blockers?: string | null
          created_at?: string
          created_by: string
          current_work?: string | null
          date: string
          end_date?: string | null
          id?: string
          next_work?: string | null
          project_id?: string | null
          start_date?: string | null
          total_time?: number | null
          updated_at: string
          video_and_links?: string | null
        }
        Update: {
          blockers?: string | null
          created_at?: string
          created_by?: string
          current_work?: string | null
          date?: string
          end_date?: string | null
          id?: string
          next_work?: string | null
          project_id?: string | null
          start_date?: string | null
          total_time?: number | null
          updated_at?: string
          video_and_links?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_daily_feedback_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_daily_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      project_file: {
        Row: {
          attachments: Json
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          updated_at: string
        }
        Update: {
          attachments?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_file_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_file_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      project_internal_chatbot_message: {
        Row: {
          attachments: Json
          author_type: Database["public"]["Enums"]["os_message_author_type"]
          created_at: string
          created_by: string | null
          id: string
          message: string | null
          project_id: string
          tool_calls: Json | null
          updated_at: string
        }
        Insert: {
          attachments?: Json
          author_type?: Database["public"]["Enums"]["os_message_author_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string | null
          project_id: string
          tool_calls?: Json | null
          updated_at?: string
        }
        Update: {
          attachments?: Json
          author_type?: Database["public"]["Enums"]["os_message_author_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string | null
          project_id?: string
          tool_calls?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_internal_chatbot_message_owner_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_internal_chatbot_message_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      project_link: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          project_id: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          updated_at: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_link_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_link_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      project_task: {
        Row: {
          assignees: string[]
          category: Database["public"]["Enums"]["os_task_category"] | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date_estimated: string | null
          end_date_real: string | null
          estimated_time: number | null
          id: string
          level: Database["public"]["Enums"]["os_task_level"] | null
          name: string | null
          order: number | null
          parent_task_id: string | null
          priority_level:
            | Database["public"]["Enums"]["os_task_priority_level"]
            | null
          project_id: string | null
          real_time: number | null
          start_date_estimated: string | null
          start_date_real: string | null
          status: Database["public"]["Enums"]["os_task_status"]
          type: Database["public"]["Enums"]["os_task_type"] | null
          updated_at: string
        }
        Insert: {
          assignees?: string[]
          category?: Database["public"]["Enums"]["os_task_category"] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date_estimated?: string | null
          end_date_real?: string | null
          estimated_time?: number | null
          id?: string
          level?: Database["public"]["Enums"]["os_task_level"] | null
          name?: string | null
          order?: number | null
          parent_task_id?: string | null
          priority_level?:
            | Database["public"]["Enums"]["os_task_priority_level"]
            | null
          project_id?: string | null
          real_time?: number | null
          start_date_estimated?: string | null
          start_date_real?: string | null
          status?: Database["public"]["Enums"]["os_task_status"]
          type?: Database["public"]["Enums"]["os_task_type"] | null
          updated_at?: string
        }
        Update: {
          assignees?: string[]
          category?: Database["public"]["Enums"]["os_task_category"] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date_estimated?: string | null
          end_date_real?: string | null
          estimated_time?: number | null
          id?: string
          level?: Database["public"]["Enums"]["os_task_level"] | null
          name?: string | null
          order?: number | null
          parent_task_id?: string | null
          priority_level?:
            | Database["public"]["Enums"]["os_task_priority_level"]
            | null
          project_id?: string | null
          real_time?: number | null
          start_date_estimated?: string | null
          start_date_real?: string | null
          status?: Database["public"]["Enums"]["os_task_status"]
          type?: Database["public"]["Enums"]["os_task_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "project_task"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      project_task_comment: {
        Row: {
          attachments: Json
          created_at: string
          created_by: string
          id: string
          message: string | null
          project_id: string | null
          task_id: string
          updated_at: string
          viewed_by: string[]
        }
        Insert: {
          attachments?: Json
          created_at?: string
          created_by: string
          id?: string
          message?: string | null
          project_id?: string | null
          task_id: string
          updated_at?: string
          viewed_by?: string[]
        }
        Update: {
          attachments?: Json
          created_at?: string
          created_by?: string
          id?: string
          message?: string | null
          project_id?: string | null
          task_id?: string
          updated_at?: string
          viewed_by?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "task_comment_owner_id_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comment_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comment_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_task"
            referencedColumns: ["id"]
          },
        ]
      }
      project_task_time_track: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string | null
          end_time_min: number | null
          id: string
          project_id: string | null
          start_date: string | null
          start_time_min: number | null
          task_id: string | null
          time_spent_h: number | null
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          end_time_min?: number | null
          id?: string
          project_id?: string | null
          start_date?: string | null
          start_time_min?: number | null
          task_id?: string | null
          time_spent_h?: number | null
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          end_time_min?: number | null
          id?: string
          project_id?: string | null
          start_date?: string | null
          start_time_min?: number | null
          task_id?: string | null
          time_spent_h?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_track_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_track_owner_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_track_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_track_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_task"
            referencedColumns: ["id"]
          },
        ]
      }
      project_video: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string | null
          project_id: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name?: string | null
          project_id?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string | null
          project_id?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_video_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_video_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          group: number
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          group: number
          id?: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          group?: number
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_group_fkey"
            columns: ["group"]
            isOneToOne: false
            referencedRelation: "prompt_group"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_group: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_group_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sop: {
        Row: {
          authorized_users: string[]
          created_at: string
          created_by: string | null
          id: string
          name: string | null
          order: number | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          authorized_users?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
          order?: number | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          authorized_users?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
          order?: number | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_tag: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_tag_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_version: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          sop_id: string
          updated_at: string
          version_name: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          sop_id: string
          updated_at?: string
          version_name: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          sop_id?: string
          updated_at?: string
          version_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_version_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sop_version_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sop"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_settings: {
        Row: {
          active_service: Database["public"]["Enums"]["os_ai_service"] | null
          claude_api_key: string | null
          claude_model: string | null
          created_at: string
          gemini_api_key: string | null
          gemini_model: string | null
          openai_api_key: string | null
          openai_model: string | null
          owner_id: string
          updated_at: string
        }
        Insert: {
          active_service?: Database["public"]["Enums"]["os_ai_service"] | null
          claude_api_key?: string | null
          claude_model?: string | null
          created_at?: string
          gemini_api_key?: string | null
          gemini_model?: string | null
          openai_api_key?: string | null
          openai_model?: string | null
          owner_id: string
          updated_at?: string
        }
        Update: {
          active_service?: Database["public"]["Enums"]["os_ai_service"] | null
          claude_api_key?: string | null
          claude_model?: string | null
          created_at?: string
          gemini_api_key?: string | null
          gemini_model?: string | null
          openai_api_key?: string | null
          openai_model?: string | null
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_settings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dashboard_member_project_hours: {
        Row: {
          member_id: string | null
          first_name: string | null
          last_name: string | null
          month: string | null
          project_kind: string | null
          project_id: string | null
          project_name: string | null
          hours: number | null
          entries: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_write_workspace: { Args: { p_workspace: string }; Returns: boolean }
      get_talent_by_code: { Args: { p_code: string }; Returns: Json }
      get_user_type: {
        Args: never
        Returns: Database["public"]["Enums"]["os_user_type"]
      }
      has_agency_role: {
        Args: {
          p_agency: string
          p_role: Database["public"]["Enums"]["agency_role"]
        }
        Returns: boolean
      }
      is_admin_or_manager: { Args: never; Returns: boolean }
      is_agency_member: { Args: { p_agency: string }; Returns: boolean }
      is_operational_user: { Args: never; Returns: boolean }
      is_platform_manager: { Args: never; Returns: boolean }
      is_platform_staff: { Args: never; Returns: boolean }
      is_staff_role: { Args: never; Returns: boolean }
      is_workspace_member: { Args: { p_workspace: string }; Returns: boolean }
      mark_conversation_internal_project_messages_viewed: {
        Args: { p_internal_project_id: string }
        Returns: undefined
      }
      mark_conversation_internal_project_thread_viewed: {
        Args: { p_parent_id: string }
        Returns: undefined
      }
      mark_external_project_messages_viewed: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      mark_external_project_thread_viewed: {
        Args: { p_parent_id: string }
        Returns: undefined
      }
      mark_internal_project_messages_viewed: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      mark_internal_project_thread_viewed: {
        Args: { p_parent_id: string }
        Returns: undefined
      }
      mark_internal_task_comments_viewed: {
        Args: { p_internal_task_id: string }
        Returns: undefined
      }
      mark_playbook_comment_replies_viewed: {
        Args: { p_comment_id: string }
        Returns: undefined
      }
      mark_playbook_comments_viewed: {
        Args: { p_playbook_id: string }
        Returns: undefined
      }
      mark_private_conversation_messages_viewed: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      mark_private_conversation_thread_viewed: {
        Args: { p_parent_id: string }
        Returns: undefined
      }
      mark_task_comments_viewed: {
        Args: { p_task_id: string }
        Returns: undefined
      }
      public_table_columns: {
        Args: { p_table: string }
        Returns: {
          column_name: string
          data_type: string
          is_nullable: string
        }[]
      }
      public_table_list: { Args: never; Returns: string[] }
      sign_agreement: {
        Args: { p_agreement_id: string }
        Returns: {
          signed_by: string[]
          status: Database["public"]["Enums"]["os_agreement_status"]
        }[]
      }
      update_talent_by_code: {
        Args: { p_code: string; p_payload: Json }
        Returns: Json
      }
    }
    Enums: {
      agency_role: "admin" | "manager" | "content_creator"
      connection_status: "active" | "pending" | "failed"
      content_source: "autopilot" | "manual"
      internal_goal_status:
        | "prospecting"
        | "not_started"
        | "in_progress"
        | "done"
        | "archived"
        | "blocked"
      internal_key_result_status:
        | "not_started"
        | "in_progress"
        | "ready_for_qa"
        | "done"
        | "blocked"
        | "archived"
      mkt_channel:
        | "email"
        | "linkedin"
        | "google_maps"
        | "instagram"
        | "facebook"
        | "reddit"
        | "x"
        | "social_discovery"
      mkt_content_status: "draft" | "scheduled" | "posted" | "failed"
      mkt_funnel_mode: "b2b_outreach" | "consumer_capture" | "hybrid"
      mkt_outreach_status:
        | "queued"
        | "sent"
        | "opened"
        | "replied"
        | "bounced"
        | "unsub"
      mkt_signal_type: "quiz" | "waitlist" | "preorder"
      mkt_validation_status: "validating" | "killed" | "doubling_down"
      os_agreement_status:
        | "not_available"
        | "ready_to_sign"
        | "completed"
        | "archived"
      os_agreement_type:
        | "nda"
        | "proposal_quotation"
        | "service_agreement"
        | "launch_handoff"
      os_ai_service: "gemini" | "claude" | "openai"
      os_ai_status: "pending" | "in_progress" | "done"
      os_company_sector: "organizational" | "operational" | "marketing"
      os_docs_type:
        | "playbook"
        | "agreements"
        | "general_docs"
        | "links"
        | "main_videos"
        | "daily_communication"
        | "invoices"
      os_idea_block:
        | "ideas"
        | "structure_align"
        | "refining_icp"
        | "product_definition_flows"
        | "strategic_frameworks"
        | "benchmarking"
        | "prd"
        | "database"
        | "visual_styles"
        | "milestones_and_tasks"
        | "report"
        | "playbook"
      os_idea_chatbot_message_type: "user" | "chatbot"
      os_idea_field:
        | "product_overview"
        | "essential_features"
        | "user_flows"
        | "value_proposition"
        | "jtbd_synthesis"
        | "icp_architect"
        | "nabc_pitch"
        | "structure_align"
        | "humanizing_target_audience"
        | "primary_success_metric"
        | "day_in_life"
        | "pain_points_acute_needs"
      os_internal_goals_status:
        | "prospecting"
        | "not_started"
        | "in_progress"
        | "done"
        | "archived"
        | "blocked"
      os_internal_key_result_status:
        | "not_started"
        | "in_progress"
        | "ready_for_qa"
        | "done"
        | "blocked"
        | "archived"
      os_internal_project_status:
        | "not_started"
        | "in_progress"
        | "ready_for_qa"
        | "done"
        | "blocked"
        | "archived"
      os_internal_task_status:
        | "not_started"
        | "in_progress"
        | "done"
        | "blocked"
      os_message_author_type: "user" | "chatbot"
      os_playbook_comment_status: "pending" | "solved"
      os_professional_type: "developer" | "marketing"
      os_programming_language:
        | "javascript"
        | "php"
        | "html_css"
        | "sql"
        | "vba"
        | "python"
        | "react_native"
        | "ruby"
        | "dart"
        | "csharp"
        | "cpp"
        | "typescript"
        | "kotlin"
        | "swift"
        | "solidity"
        | "go"
        | "rust"
        | "java"
        | "scala"
        | "elixir"
        | "erlang"
        | "haskell"
        | "clojure"
        | "fsharp"
        | "ocaml"
        | "julia"
        | "r_lang"
        | "matlab"
        | "lua"
        | "perl"
        | "bash"
        | "powershell"
        | "objective_c"
        | "groovy"
        | "assembly"
        | "graphql"
        | "nosql"
        | "shell"
        | "crystal"
        | "nim"
        | "zig"
        | "d_lang"
        | "fortran"
        | "cobol"
      os_project_status:
        | "prospecting"
        | "not_started"
        | "in_progress"
        | "done"
        | "blocked"
        | "archived"
        | "lost_deal"
      os_talent_authority_level:
        | "rock_star"
        | "known"
        | "unknown"
        | "rising_star"
        | "explorer"
      os_talent_level:
        | "agency_owner"
        | "cto"
        | "tech_lead"
        | "senior"
        | "mid_level"
        | "junior"
      os_task_category:
        | "main_task"
        | "bug"
        | "ui_ux_improvement"
        | "performance_improvement"
        | "code_improvement"
        | "new_feature"
        | "security_vulnerability"
      os_task_level: "level_1" | "level_2" | "level_3" | "level_4"
      os_task_name:
        | "milestone_1_sign_in_sign_up"
        | "milestone_2_core_client_flows"
        | "milestone_3_seller_core_flows"
        | "milestone_4_admin_flows"
        | "milestone_5_final_qa_handoff"
        | "client_requests"
        | "qa_requests"
      os_task_priority:
        | "blocker"
        | "critical"
        | "high"
        | "medium"
        | "low"
        | "trivial"
      os_task_priority_level: "critical" | "high" | "medium" | "low" | "trivial"
      os_task_status:
        | "not_started"
        | "in_progress"
        | "ready_for_qa"
        | "done"
        | "blocked"
      os_task_type:
        | "internal_checklist"
        | "stages_checking"
        | "developer_tasks"
        | "client_requests"
        | "qa_requests"
      os_theme_choice: "light" | "dark"
      os_tool:
        | "replit"
        | "bubble"
        | "n8n"
        | "supabase"
        | "xano"
        | "javascript"
        | "weweb"
        | "flutterflow"
        | "lovable"
        | "cursor"
        | "figma_design"
        | "figma_make"
        | "make"
        | "adalo"
        | "airtable"
        | "webflow"
        | "zapier"
        | "claude_code"
        | "antigravity"
        | "github_copilot"
        | "windsurf"
        | "codeium"
        | "aider"
        | "devin"
        | "v0"
        | "bolt"
        | "tempo"
        | "framer"
        | "plasmic"
        | "wix"
        | "squarespace"
        | "shopify"
        | "retool"
        | "glide"
        | "softr"
        | "draftbit"
        | "firebase"
        | "hasura"
        | "postgres"
        | "mongodb"
        | "mysql"
        | "redis"
        | "planetscale"
        | "neon"
        | "sketch"
        | "adobe_xd"
        | "photoshop"
        | "illustrator"
        | "after_effects"
        | "premiere"
        | "miro"
        | "vercel"
        | "netlify"
        | "github"
        | "gitlab"
        | "docker"
        | "kubernetes"
        | "aws"
        | "gcp"
        | "azure"
        | "cloudflare"
        | "notion"
        | "slack"
        | "linear"
        | "jira"
        | "asana"
        | "monday"
        | "trello"
        | "clickup"
        | "loom"
        | "openai"
        | "anthropic_api"
        | "langchain"
        | "pinecone"
        | "stripe"
        | "twilio"
        | "sendgrid"
        | "segment"
        | "mixpanel"
        | "amplitude"
        | "posthog"
      os_user_type:
        | "admin"
        | "manager"
        | "operational"
        | "developer"
        | "client"
        | "qa"
        | "referrer"
        | "lead"
      os_view_type: "list" | "kanban"
      platform_role: "manager" | "staff"
      post_status:
        | "generating"
        | "pending"
        | "approved"
        | "scheduled"
        | "published"
        | "failed"
      workspace_role: "admin" | "marketing_manager" | "viewer"
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
      agency_role: ["admin", "manager", "content_creator"],
      connection_status: ["active", "pending", "failed"],
      content_source: ["autopilot", "manual"],
      internal_goal_status: [
        "prospecting",
        "not_started",
        "in_progress",
        "done",
        "archived",
        "blocked",
      ],
      internal_key_result_status: [
        "not_started",
        "in_progress",
        "ready_for_qa",
        "done",
        "blocked",
        "archived",
      ],
      mkt_channel: [
        "email",
        "linkedin",
        "google_maps",
        "instagram",
        "facebook",
        "reddit",
        "x",
        "social_discovery",
      ],
      mkt_content_status: ["draft", "scheduled", "posted", "failed"],
      mkt_funnel_mode: ["b2b_outreach", "consumer_capture", "hybrid"],
      mkt_outreach_status: [
        "queued",
        "sent",
        "opened",
        "replied",
        "bounced",
        "unsub",
      ],
      mkt_signal_type: ["quiz", "waitlist", "preorder"],
      mkt_validation_status: ["validating", "killed", "doubling_down"],
      os_agreement_status: [
        "not_available",
        "ready_to_sign",
        "completed",
        "archived",
      ],
      os_agreement_type: [
        "nda",
        "proposal_quotation",
        "service_agreement",
        "launch_handoff",
      ],
      os_ai_service: ["gemini", "claude", "openai"],
      os_ai_status: ["pending", "in_progress", "done"],
      os_company_sector: ["organizational", "operational", "marketing"],
      os_docs_type: [
        "playbook",
        "agreements",
        "general_docs",
        "links",
        "main_videos",
        "daily_communication",
        "invoices",
      ],
      os_idea_block: [
        "ideas",
        "structure_align",
        "refining_icp",
        "product_definition_flows",
        "strategic_frameworks",
        "benchmarking",
        "prd",
        "database",
        "visual_styles",
        "milestones_and_tasks",
        "report",
        "playbook",
      ],
      os_idea_chatbot_message_type: ["user", "chatbot"],
      os_idea_field: [
        "product_overview",
        "essential_features",
        "user_flows",
        "value_proposition",
        "jtbd_synthesis",
        "icp_architect",
        "nabc_pitch",
        "structure_align",
        "humanizing_target_audience",
        "primary_success_metric",
        "day_in_life",
        "pain_points_acute_needs",
      ],
      os_internal_goals_status: [
        "prospecting",
        "not_started",
        "in_progress",
        "done",
        "archived",
        "blocked",
      ],
      os_internal_key_result_status: [
        "not_started",
        "in_progress",
        "ready_for_qa",
        "done",
        "blocked",
        "archived",
      ],
      os_internal_project_status: [
        "not_started",
        "in_progress",
        "ready_for_qa",
        "done",
        "blocked",
        "archived",
      ],
      os_internal_task_status: [
        "not_started",
        "in_progress",
        "done",
        "blocked",
      ],
      os_message_author_type: ["user", "chatbot"],
      os_playbook_comment_status: ["pending", "solved"],
      os_professional_type: ["developer", "marketing"],
      os_programming_language: [
        "javascript",
        "php",
        "html_css",
        "sql",
        "vba",
        "python",
        "react_native",
        "ruby",
        "dart",
        "csharp",
        "cpp",
        "typescript",
        "kotlin",
        "swift",
        "solidity",
        "go",
        "rust",
        "java",
        "scala",
        "elixir",
        "erlang",
        "haskell",
        "clojure",
        "fsharp",
        "ocaml",
        "julia",
        "r_lang",
        "matlab",
        "lua",
        "perl",
        "bash",
        "powershell",
        "objective_c",
        "groovy",
        "assembly",
        "graphql",
        "nosql",
        "shell",
        "crystal",
        "nim",
        "zig",
        "d_lang",
        "fortran",
        "cobol",
      ],
      os_project_status: [
        "prospecting",
        "not_started",
        "in_progress",
        "done",
        "blocked",
        "archived",
        "lost_deal",
      ],
      os_talent_authority_level: [
        "rock_star",
        "known",
        "unknown",
        "rising_star",
        "explorer",
      ],
      os_talent_level: [
        "agency_owner",
        "cto",
        "tech_lead",
        "senior",
        "mid_level",
        "junior",
      ],
      os_task_category: [
        "main_task",
        "bug",
        "ui_ux_improvement",
        "performance_improvement",
        "code_improvement",
        "new_feature",
        "security_vulnerability",
      ],
      os_task_level: ["level_1", "level_2", "level_3", "level_4"],
      os_task_name: [
        "milestone_1_sign_in_sign_up",
        "milestone_2_core_client_flows",
        "milestone_3_seller_core_flows",
        "milestone_4_admin_flows",
        "milestone_5_final_qa_handoff",
        "client_requests",
        "qa_requests",
      ],
      os_task_priority: [
        "blocker",
        "critical",
        "high",
        "medium",
        "low",
        "trivial",
      ],
      os_task_priority_level: ["critical", "high", "medium", "low", "trivial"],
      os_task_status: [
        "not_started",
        "in_progress",
        "ready_for_qa",
        "done",
        "blocked",
      ],
      os_task_type: [
        "internal_checklist",
        "stages_checking",
        "developer_tasks",
        "client_requests",
        "qa_requests",
      ],
      os_theme_choice: ["light", "dark"],
      os_tool: [
        "replit",
        "bubble",
        "n8n",
        "supabase",
        "xano",
        "javascript",
        "weweb",
        "flutterflow",
        "lovable",
        "cursor",
        "figma_design",
        "figma_make",
        "make",
        "adalo",
        "airtable",
        "webflow",
        "zapier",
        "claude_code",
        "antigravity",
        "github_copilot",
        "windsurf",
        "codeium",
        "aider",
        "devin",
        "v0",
        "bolt",
        "tempo",
        "framer",
        "plasmic",
        "wix",
        "squarespace",
        "shopify",
        "retool",
        "glide",
        "softr",
        "draftbit",
        "firebase",
        "hasura",
        "postgres",
        "mongodb",
        "mysql",
        "redis",
        "planetscale",
        "neon",
        "sketch",
        "adobe_xd",
        "photoshop",
        "illustrator",
        "after_effects",
        "premiere",
        "miro",
        "vercel",
        "netlify",
        "github",
        "gitlab",
        "docker",
        "kubernetes",
        "aws",
        "gcp",
        "azure",
        "cloudflare",
        "notion",
        "slack",
        "linear",
        "jira",
        "asana",
        "monday",
        "trello",
        "clickup",
        "loom",
        "openai",
        "anthropic_api",
        "langchain",
        "pinecone",
        "stripe",
        "twilio",
        "sendgrid",
        "segment",
        "mixpanel",
        "amplitude",
        "posthog",
      ],
      os_user_type: [
        "admin",
        "manager",
        "operational",
        "developer",
        "client",
        "qa",
        "referrer",
        "lead",
      ],
      os_view_type: ["list", "kanban"],
      platform_role: ["manager", "staff"],
      post_status: [
        "generating",
        "pending",
        "approved",
        "scheduled",
        "published",
        "failed",
      ],
      workspace_role: ["admin", "marketing_manager", "viewer"],
    },
  },
} as const

