

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."habit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "habit_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "status" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_status" CHECK (("status" = ANY (ARRAY['achieved'::"text", 'not_achieved'::"text"])))
);


ALTER TABLE "public"."habit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habit_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text",
    "default_frequency_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."habit_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "template_id" "uuid",
    "name" "text" NOT NULL,
    "icon" "text",
    "frequency_type" "text" NOT NULL,
    "frequency_value" integer DEFAULT 1 NOT NULL,
    "frequency_days" integer[],
    "frequency_month_day" integer,
    "start_date" "date" NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "valid_frequency_type" CHECK (("frequency_type" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text"]))),
    CONSTRAINT "valid_monthly_day" CHECK ((("frequency_type" <> 'monthly'::"text") OR (("frequency_month_day" IS NOT NULL) AND (("frequency_month_day" >= 1) AND ("frequency_month_day" <= 31))))),
    CONSTRAINT "valid_weekly_days" CHECK ((("frequency_type" <> 'weekly'::"text") OR (("frequency_days" IS NOT NULL) AND ("array_length"("frequency_days", 1) > 0))))
);


ALTER TABLE "public"."habits" OWNER TO "postgres";


ALTER TABLE ONLY "public"."habit_logs"
    ADD CONSTRAINT "habit_logs_habit_id_date_key" UNIQUE ("habit_id", "date");



ALTER TABLE ONLY "public"."habit_logs"
    ADD CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."habit_templates"
    ADD CONSTRAINT "habit_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_habit_logs_date" ON "public"."habit_logs" USING "btree" ("date");



CREATE INDEX "idx_habit_logs_habit_id" ON "public"."habit_logs" USING "btree" ("habit_id");



CREATE INDEX "idx_habits_template_id" ON "public"."habits" USING "btree" ("template_id");



CREATE INDEX "idx_habits_user_id" ON "public"."habits" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_habit_logs_updated_at" BEFORE UPDATE ON "public"."habit_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_habit_templates_updated_at" BEFORE UPDATE ON "public"."habit_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_habits_updated_at" BEFORE UPDATE ON "public"."habits" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."habit_logs"
    ADD CONSTRAINT "habit_logs_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."habit_templates"("id");



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can delete their own habit logs" ON "public"."habit_logs" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."habits"
  WHERE (("habits"."id" = "habit_logs"."habit_id") AND ("habits"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own habits" ON "public"."habits" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own habit logs" ON "public"."habit_logs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."habits"
  WHERE (("habits"."id" = "habit_logs"."habit_id") AND ("habits"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own habits" ON "public"."habits" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own habit logs" ON "public"."habit_logs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."habits"
  WHERE (("habits"."id" = "habit_logs"."habit_id") AND ("habits"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own habits" ON "public"."habits" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own habit logs" ON "public"."habit_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."habits"
  WHERE (("habits"."id" = "habit_logs"."habit_id") AND ("habits"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own habits" ON "public"."habits" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."habit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."habits" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."habit_logs" TO "anon";
GRANT ALL ON TABLE "public"."habit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."habit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."habit_templates" TO "anon";
GRANT ALL ON TABLE "public"."habit_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."habit_templates" TO "service_role";



GRANT ALL ON TABLE "public"."habits" TO "anon";
GRANT ALL ON TABLE "public"."habits" TO "authenticated";
GRANT ALL ON TABLE "public"."habits" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
