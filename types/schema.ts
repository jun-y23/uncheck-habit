export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					operationName?: string;
					query?: string;
					variables?: Json;
					extensions?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			habit_daily_statistics: {
				Row: {
					achieved_days: number;
					achievement_rate: number;
					calculated_at: string;
					habit_id: string | null;
					id: string;
					total_days: number;
				};
				Insert: {
					achieved_days: number;
					achievement_rate: number;
					calculated_at?: string;
					habit_id?: string | null;
					id?: string;
					total_days: number;
				};
				Update: {
					achieved_days?: number;
					achievement_rate?: number;
					calculated_at?: string;
					habit_id?: string | null;
					id?: string;
					total_days?: number;
				};
				Relationships: [
					{
						foreignKeyName: "habit_daily_statistics_habit_id_fkey";
						columns: ["habit_id"];
						isOneToOne: false;
						referencedRelation: "habit_statistics_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "habit_daily_statistics_habit_id_fkey";
						columns: ["habit_id"];
						isOneToOne: false;
						referencedRelation: "habits";
						referencedColumns: ["id"];
					},
				];
			};
			habit_logs: {
				Row: {
					created_at: string;
					date: string;
					habit_id: string;
					id: string;
					notes: string | null;
					status: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					date: string;
					habit_id: string;
					id?: string;
					notes?: string | null;
					status: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					date?: string;
					habit_id?: string;
					id?: string;
					notes?: string | null;
					status?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "habit_logs_habit_id_fkey";
						columns: ["habit_id"];
						isOneToOne: false;
						referencedRelation: "habit_statistics_view";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "habit_logs_habit_id_fkey";
						columns: ["habit_id"];
						isOneToOne: false;
						referencedRelation: "habits";
						referencedColumns: ["id"];
					},
				];
			};
			habit_templates: {
				Row: {
					created_at: string;
					default_frequency_type: string;
					icon: string | null;
					id: string;
					name: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					default_frequency_type: string;
					icon?: string | null;
					id?: string;
					name: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					default_frequency_type?: string;
					icon?: string | null;
					id?: string;
					name?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			habits: {
				Row: {
					created_at: string;
					frequency_days: number[] | null;
					frequency_month_day: number | null;
					frequency_type: string;
					frequency_value: number;
					icon: string | null;
					id: string;
					is_archived: boolean;
					name: string;
					start_date: string;
					template_id: string | null;
					updated_at: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					frequency_days?: number[] | null;
					frequency_month_day?: number | null;
					frequency_type: string;
					frequency_value?: number;
					icon?: string | null;
					id?: string;
					is_archived?: boolean;
					name: string;
					start_date: string;
					template_id?: string | null;
					updated_at?: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					frequency_days?: number[] | null;
					frequency_month_day?: number | null;
					frequency_type?: string;
					frequency_value?: number;
					icon?: string | null;
					id?: string;
					is_archived?: boolean;
					name?: string;
					start_date?: string;
					template_id?: string | null;
					updated_at?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "habits_template_id_fkey";
						columns: ["template_id"];
						isOneToOne: false;
						referencedRelation: "habit_templates";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Views: {
			habit_statistics_view: {
				Row: {
					achieved_days: number | null;
					achievement_rate: number | null;
					calculated_at: string | null;
					id: string | null;
					name: string | null;
					start_date: string | null;
					total_days: number | null;
					user_id: string | null;
				};
				Relationships: [];
			};
		};
		Functions: {
			calculate_habit_statistics: {
				Args: Record<PropertyKey, never>;
				Returns: undefined;
			};
			install_extensions: {
				Args: Record<PropertyKey, never>;
				Returns: undefined;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
	PublicTableNameOrOptions extends
		| keyof (PublicSchema["Tables"] & PublicSchema["Views"])
		| { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
				Database[PublicTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
			Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
				PublicSchema["Views"])
		? (PublicSchema["Tables"] &
				PublicSchema["Views"])[PublicTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	PublicTableNameOrOptions extends
		| keyof PublicSchema["Tables"]
		| { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
		? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	PublicTableNameOrOptions extends
		| keyof PublicSchema["Tables"]
		| { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
		? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	PublicEnumNameOrOptions extends
		| keyof PublicSchema["Enums"]
		| { schema: keyof Database },
	EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
	? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
		? PublicSchema["Enums"][PublicEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof PublicSchema["CompositeTypes"]
		| { schema: keyof Database },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
	? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
		? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;
