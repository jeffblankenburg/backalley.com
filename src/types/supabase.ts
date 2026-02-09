export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          email?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      games: {
        Row: {
          id: string;
          status: string;
          starting_dealer_index: number;
          current_round_index: number;
          created_by: string;
          created_at: string;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          status: string;
          starting_dealer_index: number;
          current_round_index: number;
          created_by: string;
          created_at?: string;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          status?: string;
          current_round_index?: number;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      game_players: {
        Row: {
          id: string;
          game_id: string;
          user_id: string;
          seat_position: number;
        };
        Insert: {
          id?: string;
          game_id: string;
          user_id: string;
          seat_position: number;
        };
        Update: {
          seat_position?: number;
        };
        Relationships: [];
      };
      rounds: {
        Row: {
          id: string;
          game_id: string;
          round_index: number;
          hand_size: number;
          trump_suit: string | null;
          dealer_user_id: string;
          bids_entered: boolean;
          is_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          round_index: number;
          hand_size: number;
          trump_suit?: string | null;
          dealer_user_id: string;
          bids_entered?: boolean;
          is_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          trump_suit?: string | null;
          bids_entered?: boolean;
          is_complete?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      player_rounds: {
        Row: {
          id: string;
          round_id: string;
          user_id: string;
          bid: number;
          board_level: number;
          tricks_taken: number;
          rainbow: boolean;
          jobo: boolean;
          score: number;
          cumulative_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          user_id: string;
          bid?: number;
          board_level?: number;
          tricks_taken?: number;
          rainbow?: boolean;
          jobo?: boolean;
          score?: number;
          cumulative_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          bid?: number;
          board_level?: number;
          tricks_taken?: number;
          rainbow?: boolean;
          jobo?: boolean;
          score?: number;
          cumulative_score?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
