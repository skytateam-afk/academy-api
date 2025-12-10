CREATE SCHEMA "public";
CREATE TABLE "announcement_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"announcement_id" uuid NOT NULL UNIQUE,
	"user_id" uuid NOT NULL UNIQUE,
	"is_dismissed" boolean DEFAULT false,
	"viewed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"dismissed_at" timestamp with time zone,
	CONSTRAINT "announcement_views_announcement_id_user_id_unique" UNIQUE("announcement_id","user_id")
);
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'info',
	"priority" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"target_audience" text DEFAULT 'all',
	"is_dismissible" boolean DEFAULT true,
	"action_label" varchar(100),
	"action_url" varchar(500),
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "announcements_target_audience_check" CHECK (CHECK ((target_audience = ANY (ARRAY['all'::text, 'students'::text, 'instructors'::text, 'admins'::text])))),
	CONSTRAINT "announcements_type_check" CHECK (CHECK ((type = ANY (ARRAY['info'::text, 'warning'::text, 'success'::text, 'error'::text]))))
);
CREATE TABLE "assignment_submissions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL,
	"assignment_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"submission_text" text,
	"submission_url" text,
	"file_urls" text[],
	"submitted_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"graded_at" timestamp,
	"graded_by" uuid,
	"score" integer,
	"max_score" integer,
	"feedback" text,
	"status" varchar(20) DEFAULT 'submitted',
	"is_late" boolean DEFAULT false,
	CONSTRAINT "assignment_submissions_status_check" CHECK (CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'submitted'::character varying, 'graded'::character varying, 'returned'::character varying])::text[]))))
);
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"lesson_id" uuid,
	"course_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"instructions" text,
	"max_score" integer DEFAULT 100,
	"due_date" timestamp,
	"allow_late_submission" boolean DEFAULT false,
	"late_penalty_percent" integer DEFAULT 0,
	"submission_type" varchar(20),
	"max_file_size" bigint,
	"allowed_file_types" text[],
	"is_published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "assignments_submission_type_check" CHECK (CHECK (((submission_type)::text = ANY ((ARRAY['file'::character varying, 'text'::character varying, 'url'::character varying, 'mixed'::character varying])::text[]))))
);
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid,
	"username" varchar(50),
	"action" varchar(100) NOT NULL,
	"resource" varchar(100),
	"resource_id" uuid,
	"ip_address" inet,
	"user_agent" text,
	"success" boolean NOT NULL,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"name" varchar(100) NOT NULL CONSTRAINT "categories_name_key" UNIQUE,
	"slug" varchar(100) NOT NULL CONSTRAINT "categories_slug_key" UNIQUE,
	"description" text,
	"parent_id" uuid,
	"icon_url" text,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL UNIQUE,
	"course_id" uuid NOT NULL UNIQUE,
	"certificate_number" varchar(255) NOT NULL CONSTRAINT "certificates_certificate_number_unique" UNIQUE,
	"issued_at" timestamp with time zone NOT NULL,
	"certificate_data" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "certificates_user_id_course_id_unique" UNIQUE("user_id","course_id")
);
CREATE TABLE "classroom_students" (
	"id" serial PRIMARY KEY,
	"classroom_id" integer NOT NULL UNIQUE,
	"student_id" uuid NOT NULL UNIQUE,
	"enrollment_number" varchar(50),
	"roll_number" integer,
	"assigned_date" date DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"status" text DEFAULT 'active',
	"notes" text,
	"assigned_by" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "classroom_students_classroom_id_student_id_unique" UNIQUE("classroom_id","student_id"),
	CONSTRAINT "classroom_students_status_check" CHECK (CHECK ((status = ANY (ARRAY['active'::text, 'transferred'::text, 'completed'::text, 'withdrawn'::text]))))
);
CREATE TABLE "classroom_teachers" (
	"id" serial PRIMARY KEY,
	"classroom_id" integer NOT NULL UNIQUE,
	"teacher_id" uuid NOT NULL UNIQUE,
	"is_primary" boolean DEFAULT false,
	"assigned_date" date DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"status" text DEFAULT 'active',
	"notes" text,
	"assigned_by" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "classroom_teachers_classroom_id_teacher_id_unique" UNIQUE("classroom_id","teacher_id"),
	CONSTRAINT "classroom_teachers_status_check" CHECK (CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text]))))
);
CREATE TABLE "classrooms" (
	"id" serial PRIMARY KEY,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL CONSTRAINT "classrooms_code_unique" UNIQUE,
	"level" text NOT NULL,
	"type" text DEFAULT 'secondary' NOT NULL,
	"section" varchar(10),
	"capacity" integer,
	"academic_year" integer NOT NULL,
	"academic_term" varchar(20),
	"class_teacher_id" uuid,
	"room_number" varchar(50),
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "classrooms_level_check" CHECK (CHECK ((level = ANY (ARRAY['jss1'::text, 'jss2'::text, 'jss3'::text, 'ss1'::text, 'ss2'::text, 'ss3'::text, 'year1'::text, 'year2'::text, 'year3'::text, 'year4'::text, 'year5'::text, 'other'::text])))),
	CONSTRAINT "classrooms_type_check" CHECK (CHECK ((type = ANY (ARRAY['secondary'::text, 'university'::text, 'other'::text]))))
);
CREATE TABLE "contact_submissions" (
	"id" serial PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"subject" varchar(500) NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'new',
	"admin_notes" text,
	"replied_by" uuid,
	"replied_at" timestamp with time zone,
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "contact_submissions_status_check" CHECK (CHECK ((status = ANY (ARRAY['new'::text, 'read'::text, 'replied'::text, 'archived'::text]))))
);
CREATE TABLE "course_prerequisites" (
	"course_id" uuid,
	"prerequisite_course_id" uuid,
	CONSTRAINT "course_prerequisites_pkey" PRIMARY KEY("course_id","prerequisite_course_id"),
	CONSTRAINT "no_self_prerequisite" CHECK (CHECK ((course_id <> prerequisite_course_id)))
);
CREATE TABLE "course_reviews" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL UNIQUE,
	"course_id" uuid NOT NULL UNIQUE,
	"enrollment_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"review_text" text,
	"is_published" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "unique_user_course_review" UNIQUE("user_id","course_id"),
	CONSTRAINT "course_reviews_rating_check" CHECK (CHECK (((rating >= 1) AND (rating <= 5))))
);
CREATE TABLE "course_tags" (
	"course_id" uuid,
	"tag_id" uuid,
	CONSTRAINT "course_tags_pkey" PRIMARY KEY("course_id","tag_id")
);
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL CONSTRAINT "courses_slug_key" UNIQUE,
	"description" text,
	"short_description" text,
	"thumbnail_url" text,
	"preview_video_url" text,
	"category_id" uuid,
	"instructor_id" uuid,
	"level" varchar(20),
	"language" varchar(10) DEFAULT 'en',
	"duration_hours" numeric(10, 2),
	"price" numeric(10, 2) DEFAULT '0.00',
	"currency" varchar(3) DEFAULT 'USD',
	"is_published" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"published_at" timestamp,
	"enrollment_limit" integer,
	"enrollment_count" integer DEFAULT 0,
	"rating_average" numeric(3, 2) DEFAULT '0.00',
	"rating_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"completion_count" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"is_certification" boolean DEFAULT false,
	"subscription_tier_id" uuid,
	CONSTRAINT "courses_level_check" CHECK (CHECK (((level)::text = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'all'::character varying])::text[]))))
);
CREATE TABLE "document_folders" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL UNIQUE,
	"parent_folder_id" uuid UNIQUE,
	"name" varchar(255) NOT NULL UNIQUE,
	"description" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "document_folders_user_id_parent_folder_id_name_unique" UNIQUE("user_id","parent_folder_id","name")
);
CREATE TABLE "document_shares" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"document_id" uuid NOT NULL,
	"shared_by" uuid NOT NULL,
	"shared_with_user_id" uuid,
	"share_type" text NOT NULL,
	"permission_level" text DEFAULT 'view',
	"access_token" varchar(255) CONSTRAINT "document_shares_access_token_unique" UNIQUE,
	"password_hash" varchar(255),
	"expires_at" timestamp with time zone,
	"max_downloads" integer,
	"download_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"recipient_email" varchar(255),
	CONSTRAINT "document_shares_permission_level_check" CHECK (CHECK ((permission_level = ANY (ARRAY['view'::text, 'edit'::text, 'owner'::text])))),
	CONSTRAINT "document_shares_share_type_check" CHECK (CHECK ((share_type = ANY (ARRAY['user'::text, 'link'::text, 'password'::text, 'public'::text]))))
);
CREATE TABLE "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"document_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"file_url" text NOT NULL,
	"file_size" bigint NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"change_notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL,
	"folder_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"file_url" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" bigint NOT NULL,
	"mime_type" varchar(100),
	"tags" text[],
	"version" integer DEFAULT 1,
	"is_public" boolean DEFAULT false,
	"download_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"deleted_at" timestamp with time zone
);
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL UNIQUE,
	"course_id" uuid NOT NULL UNIQUE,
	"enrolled_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"started_at" timestamp,
	"completed_at" timestamp,
	"progress_percent" numeric(5, 2) DEFAULT '0.00',
	"last_accessed_at" timestamp,
	"certificate_issued_at" timestamp,
	"certificate_url" text,
	"status" varchar(20) DEFAULT 'active',
	"transaction_id" uuid,
	"enrollment_type" varchar(20) DEFAULT 'paid',
	CONSTRAINT "unique_user_course_enrollment" UNIQUE("user_id","course_id"),
	CONSTRAINT "enrollments_enrollment_type_check" CHECK (CHECK (((enrollment_type)::text = ANY ((ARRAY['free'::character varying, 'paid'::character varying, 'gifted'::character varying, 'admin'::character varying])::text[])))),
	CONSTRAINT "enrollments_status_check" CHECK (CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'dropped'::character varying, 'suspended'::character varying])::text[]))))
);
CREATE TABLE "grading_scales" (
	"id" serial PRIMARY KEY,
	"name" varchar(100) NOT NULL,
	"grade_config" jsonb NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "institution_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() CONSTRAINT "institution_settings_id_unique" UNIQUE,
	"organization_name" varchar(255) DEFAULT 'Learning Management System' NOT NULL,
	"organization_description" text,
	"tagline" varchar(500),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"support_email" varchar(255),
	"address" text,
	"website" varchar(500),
	"facebook_url" varchar(500),
	"twitter_url" varchar(500),
	"linkedin_url" varchar(500),
	"instagram_url" varchar(500),
	"youtube_url" varchar(500),
	"logo_url" varchar(1000),
	"logo_dark_url" varchar(1000),
	"favicon_url" varchar(1000),
	"banner_url" varchar(1000),
	"primary_color" varchar(7) DEFAULT '#22c55e',
	"secondary_color" varchar(7) DEFAULT '#3b82f6',
	"accent_color" varchar(7) DEFAULT '#8b5cf6',
	"font_family" varchar(100) DEFAULT 'Inter',
	"max_upload_size" integer DEFAULT 10485760,
	"allow_public_registration" boolean DEFAULT true,
	"require_email_verification" boolean DEFAULT true,
	"enable_course_reviews" boolean DEFAULT true,
	"enable_certificates" boolean DEFAULT true,
	"footer_text" text,
	"copyright_text" text,
	"terms_url" text,
	"privacy_url" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"currency_code" varchar(3) DEFAULT 'NGN',
	"currency_symbol" varchar(10) DEFAULT '₦',
	"currency_position" varchar(10) DEFAULT 'before'
);
CREATE TABLE "job_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"job_id" uuid,
	"user_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"resume_url" varchar(500) NOT NULL,
	"cover_letter_url" varchar(500),
	"status" text DEFAULT 'pending',
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "job_applications_status_check" CHECK (CHECK ((status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'shortlisted'::text, 'interview'::text, 'rejected'::text, 'hired'::text, 'withdrawn'::text]))))
);
CREATE TABLE "job_profiles" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL CONSTRAINT "job_profiles_user_id_unique" UNIQUE,
	"title" varchar(255) NOT NULL,
	"skills" text,
	"years_of_experience" integer DEFAULT 0,
	"preferred_types" jsonb,
	"preferred_locations" text,
	"resume_url" text,
	"bio" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"short_description" text,
	"location" varchar(255),
	"type" text DEFAULT 'full-time',
	"is_external" boolean DEFAULT false,
	"external_url" varchar(500),
	"is_active" boolean DEFAULT true,
	"requirements" jsonb DEFAULT '[]',
	"responsibilities" jsonb DEFAULT '[]',
	"min_salary" numeric(15, 2),
	"max_salary" numeric(15, 2),
	"currency" varchar(10) DEFAULT 'USD',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"company_logo_url" varchar(500),
	"company_name" varchar(255),
	CONSTRAINT "jobs_type_check" CHECK (CHECK ((type = ANY (ARRAY['full-time'::text, 'part-time'::text, 'contract'::text, 'remote'::text, 'internship'::text, 'freelance'::text]))))
);
CREATE TABLE "knex_migrations" (
	"id" serial PRIMARY KEY,
	"name" varchar(255),
	"batch" integer,
	"migration_time" timestamp with time zone
);
CREATE TABLE "knex_migrations_lock" (
	"index" serial PRIMARY KEY,
	"is_locked" integer
);
CREATE TABLE "lesson_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"lesson_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_type" varchar(100),
	"file_size" bigint DEFAULT 0,
	"display_order" integer DEFAULT 0,
	"is_downloadable" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "lesson_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"lesson_id" uuid NOT NULL UNIQUE,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL UNIQUE,
	"description" text,
	"content_type" text NOT NULL,
	"video_url" varchar(500),
	"video_duration" integer,
	"audio_url" varchar(500),
	"audio_duration" integer,
	"text_content" text,
	"document_url" varchar(500),
	"interactive_content" jsonb,
	"duration_minutes" integer,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_preview" boolean DEFAULT false,
	"is_published" boolean DEFAULT false,
	"version" integer DEFAULT 1 NOT NULL,
	"previous_version_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "unique_module_slug_per_lesson" UNIQUE("lesson_id","slug"),
	CONSTRAINT "lesson_modules_content_type_check" CHECK (CHECK ((content_type = ANY (ARRAY['video'::text, 'audio'::text, 'text'::text, 'document'::text, 'interactive'::text, 'mixed'::text]))))
);
CREATE TABLE "lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL UNIQUE,
	"lesson_id" uuid NOT NULL UNIQUE,
	"enrollment_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"completed_at" timestamp,
	"last_position" integer DEFAULT 0,
	"watch_time_seconds" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"completed_modules_count" integer DEFAULT 0,
	"total_modules_count" integer DEFAULT 0,
	"completion_percentage" integer DEFAULT 0,
	"course_id" uuid NOT NULL,
	CONSTRAINT "unique_user_lesson_progress" UNIQUE("user_id","lesson_id")
);
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"course_id" uuid NOT NULL UNIQUE,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL UNIQUE,
	"description" text,
	"content_data" jsonb,
	"transcript" text,
	"rich_text_content" text,
	"display_order" integer DEFAULT 0,
	"is_published" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"version" integer DEFAULT 1 NOT NULL,
	"previous_version_id" uuid,
	"scheduled_publish_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"module_count" integer DEFAULT 0,
	CONSTRAINT "unique_course_lesson_slug" UNIQUE("course_id","slug")
);
CREATE TABLE "library_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid,
	"item_id" uuid,
	"action" text NOT NULL,
	"details" text,
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "library_activity_log_action_check" CHECK (CHECK ((action = ANY (ARRAY['view'::text, 'download'::text, 'borrow'::text, 'return'::text, 'reserve'::text, 'cancel_reservation'::text, 'review'::text, 'add_to_list'::text, 'remove_from_list'::text]))))
);
CREATE TABLE "library_borrowing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"item_id" uuid,
	"user_id" uuid,
	"borrowed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"due_date" timestamp with time zone NOT NULL,
	"returned_at" timestamp with time zone,
	"status" text DEFAULT 'borrowed',
	"notes" text,
	"fine_amount" numeric(10, 2) DEFAULT '0',
	"fine_paid" boolean DEFAULT false,
	"issued_by" uuid,
	"received_by" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "library_borrowing_status_check" CHECK (CHECK ((status = ANY (ARRAY['borrowed'::text, 'returned'::text, 'overdue'::text, 'lost'::text]))))
);
CREATE TABLE "library_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL CONSTRAINT "library_categories_name_unique" UNIQUE,
	"description" text,
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"slug" varchar(100) NOT NULL CONSTRAINT "library_categories_slug_unique" UNIQUE
);
CREATE TABLE "library_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" varchar(255) NOT NULL,
	"isbn" varchar(20) CONSTRAINT "library_items_isbn_unique" UNIQUE,
	"author" varchar(255),
	"publisher" varchar(255),
	"publication_date" date,
	"description" text,
	"category_id" uuid,
	"item_type" text DEFAULT 'book',
	"format" text DEFAULT 'physical',
	"language" varchar(50) DEFAULT 'en',
	"total_copies" integer DEFAULT 1,
	"available_copies" integer DEFAULT 1,
	"cover_image_url" varchar(500),
	"file_url" varchar(500),
	"file_size" integer,
	"location" varchar(100),
	"tags" text,
	"status" text DEFAULT 'available',
	"pages" integer,
	"edition" varchar(50),
	"is_featured" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"download_count" integer DEFAULT 0,
	"added_by" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"thumbnail_url" varchar(500),
	"file_mime_type" varchar(100),
	"duration" integer,
	CONSTRAINT "library_items_format_check" CHECK (CHECK ((format = ANY (ARRAY['physical'::text, 'digital'::text, 'both'::text])))),
	CONSTRAINT "library_items_item_type_check" CHECK (CHECK ((item_type = ANY (ARRAY['book'::text, 'ebook'::text, 'journal'::text, 'magazine'::text, 'video'::text, 'audio'::text, 'other'::text])))),
	CONSTRAINT "library_items_status_check" CHECK (CHECK ((status = ANY (ARRAY['available'::text, 'unavailable'::text, 'maintenance'::text, 'archived'::text]))))
);
CREATE TABLE "library_reading_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"reading_list_id" uuid UNIQUE,
	"item_id" uuid UNIQUE,
	"sort_order" integer DEFAULT 0,
	"notes" text,
	"added_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "library_reading_list_items_reading_list_id_item_id_unique" UNIQUE("reading_list_id","item_id")
);
CREATE TABLE "library_reading_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "library_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"item_id" uuid,
	"user_id" uuid,
	"reserved_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"expires_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'active',
	"queue_position" integer,
	"notes" text,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "library_reservations_status_check" CHECK (CHECK ((status = ANY (ARRAY['active'::text, 'fulfilled'::text, 'expired'::text, 'cancelled'::text]))))
);
CREATE TABLE "library_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"item_id" uuid UNIQUE,
	"user_id" uuid UNIQUE,
	"rating" integer NOT NULL,
	"review" text,
	"is_approved" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "library_reviews_item_id_user_id_unique" UNIQUE("item_id","user_id"),
	CONSTRAINT "library_reviews_rating_check" CHECK (CHECK (((rating >= 1) AND (rating <= 5))))
);
CREATE TABLE "menu_item_user_types" (
	"id" serial PRIMARY KEY,
	"menu_item_id" integer NOT NULL UNIQUE,
	"user_type" varchar(50) NOT NULL UNIQUE,
	"is_visible" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "menu_item_user_types_menu_item_id_user_type_key" UNIQUE("menu_item_id","user_type")
);
CREATE TABLE "menu_items" (
	"id" serial PRIMARY KEY,
	"menu_key" varchar(100) NOT NULL CONSTRAINT "menu_items_menu_key_key" UNIQUE,
	"label" varchar(200) NOT NULL,
	"description" text,
	"route_path" varchar(500),
	"route_name" varchar(200),
	"icon" varchar(100),
	"parent_id" integer,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_external" boolean DEFAULT false,
	"target" varchar(20) DEFAULT '_self',
	"badge_text" varchar(50),
	"badge_variant" varchar(50),
	"requires_auth" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "menu_visibility_settings" (
	"id" serial PRIMARY KEY,
	"user_type" varchar(50) NOT NULL UNIQUE,
	"menu_key" varchar(100) NOT NULL UNIQUE,
	"is_visible" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"menu_name" varchar(255),
	"route" varchar(500),
	"icon" varchar(100),
	"description" text,
	"category" varchar(100),
	"parent_group" varchar(255),
	CONSTRAINT "menu_visibility_settings_user_type_menu_key_key" UNIQUE("user_type","menu_key")
);
CREATE TABLE "module_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"module_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"file_url" varchar(500) NOT NULL,
	"file_type" varchar(100) NOT NULL,
	"file_size" bigint NOT NULL,
	"is_downloadable" boolean DEFAULT true,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "module_progress" (
	"id" serial PRIMARY KEY,
	"user_id" uuid NOT NULL UNIQUE,
	"module_id" uuid NOT NULL UNIQUE,
	"course_id" uuid NOT NULL,
	"is_completed" boolean DEFAULT false,
	"completion_percentage" integer DEFAULT 0,
	"time_spent_seconds" integer DEFAULT 0,
	"last_accessed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"video_progress_seconds" integer,
	"video_duration_seconds" integer,
	"quiz_attempts" integer DEFAULT 0,
	"quiz_best_score" integer,
	"quiz_passed" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completion_data" jsonb,
	"quiz_score" integer,
	CONSTRAINT "module_progress_user_id_module_id_unique" UNIQUE("user_id","module_id")
);
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"data" jsonb,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "otp" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL,
	"otp_code" varchar(6) NOT NULL,
	"purpose" varchar(50) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" varchar(255) NOT NULL,
	"code" varchar(10) NOT NULL,
	"type" varchar(50) DEFAULT 'login' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_used" boolean DEFAULT false,
	"used_at" timestamp with time zone,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"metadata" jsonb
);
CREATE TABLE "parents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL CONSTRAINT "parents_email_unique" UNIQUE,
	"phone" varchar(255),
	"address" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "pathway_applications" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL UNIQUE,
	"pathway_id" uuid NOT NULL UNIQUE,
	"application_message" text,
	"applied_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"status" text DEFAULT 'pending',
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"prevent_reapplication" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "unique_user_pathway_application" UNIQUE("user_id","pathway_id"),
	CONSTRAINT "pathway_applications_status_check" CHECK (CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cannot_reapply'::text]))))
);
CREATE TABLE "pathway_courses" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"pathway_id" uuid NOT NULL UNIQUE,
	"course_id" uuid NOT NULL UNIQUE,
	"sequence_order" integer NOT NULL,
	"is_required" boolean DEFAULT true,
	"description" text,
	"learning_objectives" jsonb,
	"prerequisite_course_id" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "pathway_courses_pathway_id_course_id_unique" UNIQUE("pathway_id","course_id")
);
CREATE TABLE "pathway_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL UNIQUE,
	"pathway_id" uuid NOT NULL UNIQUE,
	"transaction_id" uuid,
	"enrollment_type" text DEFAULT 'paid',
	"progress_percent" numeric(5, 2) DEFAULT '0',
	"completed_courses" integer DEFAULT 0,
	"total_courses" integer DEFAULT 0,
	"enrolled_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"last_accessed_at" timestamp with time zone,
	"certificate_issued_at" timestamp with time zone,
	"certificate_url" varchar(255),
	"status" text DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "pathway_enrollments_user_id_pathway_id_unique" UNIQUE("user_id","pathway_id"),
	CONSTRAINT "pathway_enrollments_enrollment_type_check" CHECK (CHECK ((enrollment_type = ANY (ARRAY['free'::text, 'paid'::text, 'gifted'::text, 'admin'::text])))),
	CONSTRAINT "pathway_enrollments_status_check" CHECK (CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'dropped'::text, 'suspended'::text]))))
);
CREATE TABLE "pathway_progress" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"pathway_enrollment_id" uuid NOT NULL UNIQUE,
	"course_id" uuid NOT NULL UNIQUE,
	"enrollment_id" uuid,
	"is_started" boolean DEFAULT false,
	"is_completed" boolean DEFAULT false,
	"progress_percent" numeric(5, 2) DEFAULT '0',
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"last_accessed_at" timestamp with time zone,
	"quiz_average" numeric(5, 2),
	"assignment_average" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "pathway_progress_pathway_enrollment_id_course_id_unique" UNIQUE("pathway_enrollment_id","course_id")
);
CREATE TABLE "pathways" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL CONSTRAINT "pathways_slug_unique" UNIQUE,
	"description" text,
	"short_description" text,
	"thumbnail_url" text,
	"banner_url" text,
	"career_focus" varchar(100),
	"category_id" uuid,
	"level" text DEFAULT 'all',
	"estimated_duration_hours" numeric(10, 2),
	"course_count" integer DEFAULT 0,
	"price" numeric(10, 2) DEFAULT '0',
	"currency" varchar(3) DEFAULT 'USD',
	"has_certification" boolean DEFAULT false,
	"certification_criteria" text,
	"is_published" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"published_at" timestamp with time zone,
	"enrollment_limit" integer,
	"enrollment_count" integer DEFAULT 0,
	"created_by" uuid,
	"rating_average" numeric(3, 2) DEFAULT '0',
	"rating_count" integer DEFAULT 0,
	"completion_count" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"subscription_tier_id" uuid,
	CONSTRAINT "pathways_level_check" CHECK (CHECK ((level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'all'::text]))))
);
CREATE TABLE "payment_providers" (
	"id" serial PRIMARY KEY,
	"provider_name" varchar(255) NOT NULL CONSTRAINT "payment_providers_provider_name_unique" UNIQUE,
	"provider_display_name" varchar(255) NOT NULL,
	"secret_key_encrypted" text NOT NULL,
	"public_key_encrypted" text NOT NULL,
	"webhook_secret_encrypted" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"supported_currencies" jsonb,
	"configuration" jsonb,
	"last_tested_at" timestamp with time zone,
	"test_result" varchar(255),
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);
CREATE TABLE "payment_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"provider" varchar(20) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"processed" boolean DEFAULT false,
	"processed_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "payroll_items" (
	"id" serial PRIMARY KEY,
	"payroll_run_id" integer NOT NULL UNIQUE,
	"staff_id" integer NOT NULL UNIQUE,
	"basic_salary" numeric(15, 2) NOT NULL,
	"housing_allowance" numeric(15, 2) DEFAULT '0',
	"transport_allowance" numeric(15, 2) DEFAULT '0',
	"meal_allowance" numeric(15, 2) DEFAULT '0',
	"other_allowances" numeric(15, 2) DEFAULT '0',
	"bonus" numeric(15, 2) DEFAULT '0',
	"overtime" numeric(15, 2) DEFAULT '0',
	"gross_pay" numeric(15, 2) NOT NULL,
	"pension" numeric(15, 2) DEFAULT '0',
	"tax" numeric(15, 2) DEFAULT '0',
	"insurance" numeric(15, 2) DEFAULT '0',
	"loan_repayment" numeric(15, 2) DEFAULT '0',
	"other_deductions" numeric(15, 2) DEFAULT '0',
	"total_deductions" numeric(15, 2) DEFAULT '0',
	"net_pay" numeric(15, 2) NOT NULL,
	"working_days" integer DEFAULT 0,
	"days_worked" integer DEFAULT 0,
	"days_absent" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "payroll_items_payroll_run_id_staff_id_unique" UNIQUE("payroll_run_id","staff_id")
);
CREATE TABLE "payroll_runs" (
	"id" serial PRIMARY KEY,
	"payroll_month" varchar(7) NOT NULL CONSTRAINT "payroll_runs_payroll_month_unique" UNIQUE,
	"payroll_period" varchar(100) NOT NULL,
	"payment_date" date NOT NULL,
	"status" text DEFAULT 'draft',
	"total_gross" numeric(15, 2) DEFAULT '0',
	"total_deductions" numeric(15, 2) DEFAULT '0',
	"total_net" numeric(15, 2) DEFAULT '0',
	"staff_count" integer DEFAULT 0,
	"created_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "payroll_runs_status_check" CHECK (CHECK ((status = ANY (ARRAY['draft'::text, 'approved'::text, 'paid'::text, 'cancelled'::text]))))
);
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"name" varchar(100) NOT NULL CONSTRAINT "permissions_name_key" UNIQUE,
	"resource" varchar(50) NOT NULL UNIQUE,
	"action" varchar(50) NOT NULL UNIQUE,
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "unique_permission" UNIQUE("resource","action")
);
CREATE TABLE "promotion_displays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"promotion_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"displayed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"was_clicked" boolean DEFAULT false,
	"clicked_at" timestamp with time zone,
	"was_dismissed" boolean DEFAULT false,
	"dismissed_at" timestamp with time zone
);
CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"image_url" varchar(500),
	"display_type" text DEFAULT 'popup',
	"priority" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"target_audience" text DEFAULT 'all',
	"max_displays_per_user" integer DEFAULT 3,
	"display_frequency_hours" integer DEFAULT 24,
	"requires_action" boolean DEFAULT false,
	"action_label" varchar(100),
	"action_url" varchar(500),
	"discount_code" varchar(100),
	"targeting_rules" json,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "promotions_display_type_check" CHECK (CHECK ((display_type = ANY (ARRAY['popup'::text, 'banner'::text, 'corner'::text])))),
	CONSTRAINT "promotions_target_audience_check" CHECK (CHECK ((target_audience = ANY (ARRAY['all'::text, 'students'::text, 'instructors'::text, 'admins'::text, 'new_users'::text]))))
);
CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL,
	"quiz_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"started_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"completed_at" timestamp,
	"score" integer,
	"max_score" integer,
	"passed" boolean,
	"time_taken_seconds" integer,
	"answers" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "quiz_question_options" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"question_id" uuid NOT NULL,
	"option_text" text NOT NULL,
	"is_correct" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"quiz_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"question_type" varchar(20),
	"points" integer DEFAULT 1,
	"display_order" integer DEFAULT 0,
	"explanation" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "quiz_questions_question_type_check" CHECK (CHECK (((question_type)::text = ANY ((ARRAY['multiple_choice'::character varying, 'true_false'::character varying, 'short_answer'::character varying, 'essay'::character varying])::text[]))))
);
CREATE TABLE "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"lesson_id" uuid,
	"course_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"quiz_type" varchar(20),
	"passing_score" integer DEFAULT 70,
	"max_attempts" integer DEFAULT 3,
	"time_limit_minutes" integer,
	"is_randomized" boolean DEFAULT false,
	"show_correct_answers" boolean DEFAULT true,
	"show_results_immediately" boolean DEFAULT true,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "quizzes_quiz_type_check" CHECK (CHECK (((quiz_type)::text = ANY ((ARRAY['lesson'::character varying, 'course'::character varying, 'practice'::character varying])::text[]))))
);
CREATE TABLE "resource_tags" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"tag_id" uuid NOT NULL UNIQUE,
	"resource_type" varchar(50) NOT NULL UNIQUE,
	"resource_id" uuid NOT NULL UNIQUE,
	"tagged_by" uuid,
	"tagged_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "unique_resource_tag" UNIQUE("resource_type","resource_id","tag_id")
);
CREATE TABLE "result_batches" (
	"id" serial PRIMARY KEY,
	"batch_name" varchar(200) NOT NULL,
	"batch_code" varchar(50) NOT NULL CONSTRAINT "result_batches_batch_code_unique" UNIQUE,
	"classroom_id" integer NOT NULL,
	"academic_year" varchar(20) NOT NULL,
	"term" varchar(20) NOT NULL,
	"grading_scale_id" integer NOT NULL,
	"status" text DEFAULT 'draft',
	"csv_file_path" text,
	"error_log" text,
	"total_students" integer DEFAULT 0,
	"total_subjects" integer DEFAULT 0,
	"total_results" integer DEFAULT 0,
	"failed_imports" integer DEFAULT 0,
	"processed_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"subject_group_id" integer,
	"teacher_name" varchar(255),
	"principal_name" varchar(255),
	"teacher_signature_url" text,
	"principal_signature_url" text,
	CONSTRAINT "result_batches_status_check" CHECK (CHECK ((status = ANY (ARRAY['draft'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'published'::text]))))
);
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"role_id" uuid NOT NULL UNIQUE,
	"permission_id" uuid NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "unique_role_permission" UNIQUE("role_id","permission_id")
);
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"name" varchar(50) NOT NULL CONSTRAINT "roles_name_key" UNIQUE,
	"description" text,
	"is_system_role" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"refresh_token_hash" varchar(255),
	"ip_address" inet,
	"user_agent" text,
	"expires_at" timestamp NOT NULL,
	"refresh_expires_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"last_activity" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "shop_cart_items" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"cart_id" uuid NOT NULL UNIQUE,
	"product_id" uuid NOT NULL UNIQUE,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_at_addition" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "shop_cart_items_cart_id_product_id_unique" UNIQUE("cart_id","product_id")
);
CREATE TABLE "shop_carts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid,
	"session_id" varchar(255),
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "shop_categories" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL CONSTRAINT "shop_categories_slug_unique" UNIQUE,
	"description" text,
	"parent_id" uuid,
	"icon_url" varchar(255),
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "shop_order_items" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"product_sku" varchar(255),
	"product_description" text,
	"product_image_url" varchar(255),
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "shop_orders" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"order_number" varchar(255) NOT NULL CONSTRAINT "shop_orders_order_number_unique" UNIQUE,
	"user_id" uuid NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"shipping_amount" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"billing_address" jsonb,
	"shipping_address" jsonb,
	"customer_email" varchar(255),
	"customer_phone" varchar(255),
	"status" text DEFAULT 'pending',
	"payment_status" text DEFAULT 'pending',
	"fulfillment_status" text DEFAULT 'unfulfilled',
	"payment_method" varchar(255),
	"payment_provider_id" varchar(255),
	"transaction_id" uuid,
	"paid_at" timestamp with time zone,
	"tracking_number" varchar(255),
	"tracking_url" varchar(255),
	"shipping_carrier" varchar(255),
	"customer_notes" text,
	"admin_notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "shop_orders_fulfillment_status_check" CHECK (CHECK ((fulfillment_status = ANY (ARRAY['unfulfilled'::text, 'partially_fulfilled'::text, 'fulfilled'::text, 'cancelled'::text])))),
	CONSTRAINT "shop_orders_payment_status_check" CHECK (CHECK ((payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text, 'partially_refunded'::text])))),
	CONSTRAINT "shop_orders_status_check" CHECK (CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'paid'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text, 'refunded'::text, 'failed'::text]))))
);
CREATE TABLE "shop_product_images" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"product_id" uuid NOT NULL,
	"image_url" varchar(255) NOT NULL,
	"alt_text" varchar(255),
	"display_order" integer DEFAULT 0,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "shop_product_reviews" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL UNIQUE,
	"product_id" uuid NOT NULL UNIQUE,
	"order_id" uuid,
	"rating" integer NOT NULL,
	"review_text" text,
	"is_verified_purchase" boolean DEFAULT false,
	"is_published" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "shop_product_reviews_user_id_product_id_unique" UNIQUE("user_id","product_id"),
	CONSTRAINT "shop_product_reviews_rating_check" CHECK (CHECK (((rating >= 1) AND (rating <= 5))))
);
CREATE TABLE "shop_product_tags" (
	"product_id" uuid,
	"tag_id" uuid,
	CONSTRAINT "shop_product_tags_pkey" PRIMARY KEY("product_id","tag_id")
);
CREATE TABLE "shop_products" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL CONSTRAINT "shop_products_slug_unique" UNIQUE,
	"description" text,
	"short_description" text,
	"category_id" uuid,
	"sku" varchar(100) CONSTRAINT "shop_products_sku_unique" UNIQUE,
	"price" numeric(10, 2) NOT NULL,
	"compare_at_price" numeric(10, 2),
	"cost_price" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'USD',
	"stock_quantity" integer DEFAULT 0,
	"track_inventory" boolean DEFAULT true,
	"allow_backorders" boolean DEFAULT false,
	"stock_status" text DEFAULT 'in_stock',
	"weight" numeric(10, 2),
	"dimensions" jsonb,
	"is_physical" boolean DEFAULT true,
	"is_digital" boolean DEFAULT false,
	"digital_file_url" varchar(255),
	"meta_title" varchar(255),
	"meta_description" text,
	"metadata" jsonb,
	"is_published" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"published_at" timestamp with time zone,
	"view_count" integer DEFAULT 0,
	"sales_count" integer DEFAULT 0,
	"rating_average" numeric(3, 2) DEFAULT '0',
	"rating_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"low_stock_threshold" integer DEFAULT 0,
	CONSTRAINT "shop_products_stock_status_check" CHECK (CHECK ((stock_status = ANY (ARRAY['in_stock'::text, 'out_of_stock'::text, 'on_backorder'::text]))))
);
CREATE TABLE "shop_transactions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"order_id" uuid NOT NULL,
	"transaction_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"type" text DEFAULT 'payment',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "shop_transactions_type_check" CHECK (CHECK ((type = ANY (ARRAY['payment'::text, 'refund'::text, 'partial_refund'::text]))))
);
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY,
	"staff_id" varchar(50) NOT NULL CONSTRAINT "staff_staff_id_unique" UNIQUE,
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL CONSTRAINT "staff_email_unique" UNIQUE,
	"phone" varchar(20),
	"alternate_phone" varchar(20),
	"date_of_birth" date,
	"gender" text,
	"marital_status" text,
	"nin" varchar(11),
	"bvn" varchar(11),
	"state_of_origin" varchar(50),
	"lga_of_origin" varchar(100),
	"nationality" varchar(50) DEFAULT 'Nigerian',
	"permanent_address" text,
	"current_address" text,
	"department" varchar(100) NOT NULL,
	"position" varchar(100) NOT NULL,
	"job_title" varchar(150),
	"employment_type" text DEFAULT 'full-time',
	"employment_status" text DEFAULT 'active',
	"hire_date" date NOT NULL,
	"confirmation_date" date,
	"termination_date" date,
	"reporting_to" varchar(50),
	"highest_qualification" varchar(100),
	"institution_attended" varchar(200),
	"years_of_experience" integer DEFAULT 0,
	"certifications" text[],
	"specializations" text[],
	"basic_salary" numeric(12, 2),
	"salary_grade" varchar(20),
	"salary_step" varchar(20),
	"bank_name" varchar(100),
	"account_number" varchar(20),
	"account_name" varchar(150),
	"pension_pin" varchar(50),
	"tax_id" varchar(50),
	"next_of_kin_name" varchar(150),
	"next_of_kin_relationship" varchar(50),
	"next_of_kin_phone" varchar(20),
	"next_of_kin_address" text,
	"blood_group" varchar(5),
	"genotype" varchar(5),
	"languages_spoken" text[],
	"health_conditions" text,
	"allergies" text,
	"avatar_url" varchar(500),
	"resume_url" varchar(500),
	"document_urls" jsonb,
	"user_id" uuid,
	"permissions" text[],
	"annual_leave_days" integer DEFAULT 21,
	"sick_leave_days" integer DEFAULT 12,
	"casual_leave_days" integer DEFAULT 7,
	"last_promotion_date" date,
	"last_appraisal_date" date,
	"custom_fields" jsonb DEFAULT '{}',
	"metadata" jsonb DEFAULT '{}',
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "staff_employment_status_check" CHECK (CHECK ((employment_status = ANY (ARRAY['active'::text, 'on-leave'::text, 'suspended'::text, 'terminated'::text, 'retired'::text])))),
	CONSTRAINT "staff_employment_type_check" CHECK (CHECK ((employment_type = ANY (ARRAY['full-time'::text, 'part-time'::text, 'contract'::text, 'temporary'::text])))),
	CONSTRAINT "staff_gender_check" CHECK (CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])))),
	CONSTRAINT "staff_marital_status_check" CHECK (CHECK ((marital_status = ANY (ARRAY['single'::text, 'married'::text, 'divorced'::text, 'widowed'::text]))))
);
CREATE TABLE "staff_accounts" (
	"id" serial PRIMARY KEY,
	"staff_id" integer NOT NULL,
	"bank_name" varchar(100) NOT NULL,
	"account_number" varchar(20) NOT NULL,
	"account_name" varchar(200) NOT NULL,
	"account_type" varchar(50) DEFAULT 'savings',
	"is_primary" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "staff_salaries" (
	"id" serial PRIMARY KEY,
	"staff_id" integer NOT NULL,
	"basic_salary" numeric(15, 2) NOT NULL,
	"housing_allowance" numeric(15, 2) DEFAULT '0',
	"transport_allowance" numeric(15, 2) DEFAULT '0',
	"meal_allowance" numeric(15, 2) DEFAULT '0',
	"other_allowances" numeric(15, 2) DEFAULT '0',
	"pension_percentage" numeric(5, 2) DEFAULT '8',
	"tax_percentage" numeric(5, 2) DEFAULT '0',
	"payment_frequency" varchar(20) DEFAULT 'monthly',
	"effective_from" date NOT NULL,
	"effective_to" date,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "student_results" (
	"id" serial PRIMARY KEY,
	"classroom_id" integer NOT NULL UNIQUE,
	"student_id" uuid NOT NULL UNIQUE,
	"subject_id" integer NOT NULL UNIQUE,
	"academic_year" varchar(20) NOT NULL UNIQUE,
	"term" varchar(20) NOT NULL UNIQUE,
	"ca_score" numeric(5, 2) DEFAULT '0',
	"exam_score" numeric(5, 2) DEFAULT '0',
	"total_score" numeric(5, 2) DEFAULT '0',
	"grade" varchar(5),
	"remark" varchar(255),
	"teacher_id" uuid,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "unique_student_result" UNIQUE("classroom_id","student_id","subject_id","academic_year","term")
);
CREATE TABLE "subject_group_subjects" (
	"id" serial PRIMARY KEY,
	"subject_group_id" integer UNIQUE,
	"subject_id" integer UNIQUE,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "subject_group_subjects_subject_group_id_subject_id_key" UNIQUE("subject_group_id","subject_id")
);
CREATE TABLE "subject_groups" (
	"id" serial PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	"description" text,
	"academic_session" varchar(50),
	"term" varchar(20),
	"created_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL CONSTRAINT "subjects_code_unique" UNIQUE,
	"category" text DEFAULT 'general',
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "subjects_category_check" CHECK (CHECK ((category = ANY (ARRAY['science'::text, 'arts'::text, 'commercial'::text, 'general'::text, 'vocational'::text, 'language'::text, 'humanities'::text, 'other'::text]))))
);
CREATE TABLE "subscription_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" varchar(255) NOT NULL CONSTRAINT "subscription_tiers_slug_unique" UNIQUE,
	"name" varchar(255) NOT NULL,
	"description" text,
	"short_description" text,
	"price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"billing_cycle_months" integer DEFAULT 1,
	"billing_cycle_days" integer DEFAULT 30,
	"features" jsonb,
	"is_popular" boolean DEFAULT false,
	"max_users" integer DEFAULT -1,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"stripe_price_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "system_tags" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"tag_key" varchar(100) NOT NULL UNIQUE,
	"tag_value" varchar(255) NOT NULL UNIQUE,
	"description" text,
	"tag_type" varchar(20) DEFAULT 'custom',
	"created_by" uuid,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"category_id" uuid,
	CONSTRAINT "unique_tag_key_value" UNIQUE("tag_key","tag_value"),
	CONSTRAINT "system_tags_tag_type_check" CHECK (CHECK (((tag_type)::text = ANY ((ARRAY['system'::character varying, 'custom'::character varying, 'auto'::character varying])::text[]))))
);
CREATE TABLE "tag_categories" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"name" varchar(100) NOT NULL CONSTRAINT "tag_categories_name_key" UNIQUE,
	"description" text,
	"color" varchar(7),
	"icon" varchar(50),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"name" varchar(50) NOT NULL CONSTRAINT "tags_name_key" UNIQUE,
	"slug" varchar(50) NOT NULL CONSTRAINT "tags_slug_key" UNIQUE,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL,
	"course_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"payment_method" varchar(20),
	"payment_provider" varchar(20),
	"provider_transaction_id" varchar(255),
	"provider_reference" varchar(255),
	"status" varchar(20) DEFAULT 'pending',
	"payment_metadata" jsonb,
	"paid_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"refund_reason" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"order_id" uuid,
	CONSTRAINT "transactions_payment_method_check" CHECK (CHECK (((payment_method)::text = ANY ((ARRAY['stripe'::character varying, 'paystack'::character varying, 'free'::character varying])::text[])))),
	CONSTRAINT "transactions_status_check" CHECK (CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying, 'cancelled'::character varying])::text[]))))
);
CREATE TABLE "user_permissions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL UNIQUE,
	"permission_id" uuid NOT NULL UNIQUE,
	"granted" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "unique_user_permission" UNIQUE("user_id","permission_id")
);
CREATE TABLE "user_personalisations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL CONSTRAINT "user_personalisations_user_id_unique" UNIQUE,
	"data" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY,
	"user_id" uuid NOT NULL CONSTRAINT "user_settings_user_id_unique" UNIQUE,
	"ui_mode" varchar(255) DEFAULT 'explorer',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"theme" varchar(255) DEFAULT 'green',
	"email_course_updates" boolean DEFAULT true,
	"email_new_announcements" boolean DEFAULT true,
	"email_assignment_reminders" boolean DEFAULT true,
	"email_quiz_results" boolean DEFAULT true,
	"email_new_messages" boolean DEFAULT true,
	"email_marketing" boolean DEFAULT false,
	"inapp_course_updates" boolean DEFAULT true,
	"inapp_new_announcements" boolean DEFAULT true,
	"inapp_assignment_reminders" boolean DEFAULT true,
	"inapp_quiz_results" boolean DEFAULT true,
	"inapp_new_messages" boolean DEFAULT true,
	"profile_public" boolean DEFAULT false,
	"show_progress_publicly" boolean DEFAULT false,
	"timezone" varchar(255) DEFAULT 'UTC',
	"language" varchar(255) DEFAULT 'en',
	"theme_mode" varchar(255) DEFAULT 'light'
);
CREATE TABLE "user_storage" (
	"user_id" uuid PRIMARY KEY,
	"used_bytes" bigint DEFAULT 0,
	"quota_bytes" bigint DEFAULT 1073741824,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL UNIQUE,
	"tier_id" uuid NOT NULL UNIQUE,
	"status" varchar(255) DEFAULT 'pending' UNIQUE,
	"started_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"expires_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"payment_provider" varchar(255) DEFAULT 'manual',
	"subscription_id" varchar(255),
	"amount_paid" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'USD',
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "user_subscriptions_user_id_tier_id_status_unique" UNIQUE("user_id","tier_id","status")
);
CREATE TABLE "user_wishlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL UNIQUE,
	"item_type" text NOT NULL UNIQUE,
	"item_id" uuid NOT NULL UNIQUE,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "user_wishlist_user_id_item_type_item_id_unique" UNIQUE("user_id","item_type","item_id"),
	CONSTRAINT "user_wishlist_item_type_check" CHECK (CHECK ((item_type = ANY (ARRAY['course'::text, 'library_item'::text, 'shop_product'::text]))))
);
CREATE TABLE "user_xp" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL CONSTRAINT "user_xp_user_id_unique" UNIQUE,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"current_level" integer DEFAULT 1 NOT NULL,
	"xp_to_next_level" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"username" varchar(50) NOT NULL CONSTRAINT "users_username_key" UNIQUE,
	"email" varchar(255) NOT NULL CONSTRAINT "users_email_key" UNIQUE,
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"avatar_url" text,
	"bio" text,
	"phone" varchar(20),
	"date_of_birth" date,
	"role_id" uuid,
	"is_active" boolean DEFAULT true,
	"is_verified" boolean DEFAULT false,
	"email_verified_at" timestamp,
	"failed_login_attempts" integer DEFAULT 0,
	"locked_until" timestamp,
	"last_login" timestamp,
	"last_login_ip" inet,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"mfa_enabled" boolean DEFAULT false,
	"cover_photo_url" text,
	"parent_id" uuid,
	"active_subscription_id" uuid,
	"total_xp" integer DEFAULT 0,
	"current_level" integer DEFAULT 1,
	"google_id" varchar(255) CONSTRAINT "users_google_id_unique" UNIQUE
);
CREATE TABLE "users_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid UNIQUE,
	"permission_id" uuid UNIQUE,
	"granted_by" uuid,
	"granted_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "users_permissions_user_id_permission_id_unique" UNIQUE("user_id","permission_id")
);
CREATE TABLE "work_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid CONSTRAINT "work_profiles_user_id_unique" UNIQUE,
	"headline" varchar(255),
	"bio" text,
	"skills" jsonb DEFAULT '[]',
	"projects" jsonb DEFAULT '[]',
	"resume_url" varchar(500),
	"linkedin_url" varchar(500),
	"portfolio_url" varchar(500),
	"experience" jsonb DEFAULT '[]',
	"education" jsonb DEFAULT '[]',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "xp_activities" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"activity_type" varchar(50) NOT NULL CONSTRAINT "xp_activities_activity_type_unique" UNIQUE,
	"xp_value" integer NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "xp_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"description" text,
	"badge_icon" varchar(255),
	"badge_image_url" varchar(255),
	"badge_color" varchar(255) DEFAULT '#3B82F6',
	"min_xp" integer DEFAULT 0 NOT NULL,
	"max_xp" integer,
	"level_number" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "xp_transactions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"activity_type" varchar(50) NOT NULL,
	"reference_id" uuid,
	"reference_type" varchar(50),
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "announcement_views" ADD CONSTRAINT "announcement_views_announcement_id_foreign" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE;
ALTER TABLE "announcement_views" ADD CONSTRAINT "announcement_views_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_foreign" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE;
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE;
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "users"("id");
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_foreign" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE;
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "classroom_students" ADD CONSTRAINT "classroom_students_assigned_by_foreign" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "classroom_students" ADD CONSTRAINT "classroom_students_classroom_id_foreign" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE;
ALTER TABLE "classroom_students" ADD CONSTRAINT "classroom_students_student_id_foreign" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "classroom_teachers" ADD CONSTRAINT "classroom_teachers_assigned_by_foreign" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "classroom_teachers" ADD CONSTRAINT "classroom_teachers_classroom_id_foreign" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE;
ALTER TABLE "classroom_teachers" ADD CONSTRAINT "classroom_teachers_teacher_id_foreign" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_class_teacher_id_foreign" FOREIGN KEY ("class_teacher_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_created_by_foreign" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_updated_by_foreign" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "contact_submissions" ADD CONSTRAINT "contact_submissions_replied_by_foreign" FOREIGN KEY ("replied_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE;
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_prerequisite_course_id_fkey" FOREIGN KEY ("prerequisite_course_id") REFERENCES "courses"("id") ON DELETE CASCADE;
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE;
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE;
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "course_tags" ADD CONSTRAINT "course_tags_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE;
ALTER TABLE "course_tags" ADD CONSTRAINT "course_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE;
ALTER TABLE "courses" ADD CONSTRAINT "courses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL;
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "courses" ADD CONSTRAINT "courses_subscription_tier_id_foreign" FOREIGN KEY ("subscription_tier_id") REFERENCES "subscription_tiers"("id") ON DELETE SET NULL;
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_parent_folder_id_foreign" FOREIGN KEY ("parent_folder_id") REFERENCES "document_folders"("id") ON DELETE CASCADE;
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_document_id_foreign" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE;
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_shared_by_foreign" FOREIGN KEY ("shared_by") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_shared_with_user_id_foreign" FOREIGN KEY ("shared_with_user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_foreign" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE;
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploaded_by_foreign" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id");
ALTER TABLE "documents" ADD CONSTRAINT "documents_folder_id_foreign" FOREIGN KEY ("folder_id") REFERENCES "document_folders"("id") ON DELETE SET NULL;
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_transaction_id_foreign" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "grading_scales" ADD CONSTRAINT "grading_scales_created_by_foreign" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_foreign" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE;
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "job_profiles" ADD CONSTRAINT "job_profiles_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "lesson_attachments" ADD CONSTRAINT "lesson_attachments_lesson_id_foreign" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_modules" ADD CONSTRAINT "lesson_modules_lesson_id_foreign" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE;
ALTER TABLE "lesson_modules" ADD CONSTRAINT "lesson_modules_previous_version_id_foreign" FOREIGN KEY ("previous_version_id") REFERENCES "lesson_modules"("id") ON DELETE SET NULL;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE;
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_previous_version_id_foreign" FOREIGN KEY ("previous_version_id") REFERENCES "lessons"("id") ON DELETE SET NULL;
ALTER TABLE "library_activity_log" ADD CONSTRAINT "library_activity_log_item_id_foreign" FOREIGN KEY ("item_id") REFERENCES "library_items"("id") ON DELETE SET NULL;
ALTER TABLE "library_activity_log" ADD CONSTRAINT "library_activity_log_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "library_borrowing" ADD CONSTRAINT "library_borrowing_issued_by_foreign" FOREIGN KEY ("issued_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "library_borrowing" ADD CONSTRAINT "library_borrowing_item_id_foreign" FOREIGN KEY ("item_id") REFERENCES "library_items"("id") ON DELETE CASCADE;
ALTER TABLE "library_borrowing" ADD CONSTRAINT "library_borrowing_received_by_foreign" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "library_borrowing" ADD CONSTRAINT "library_borrowing_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_added_by_foreign" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_category_id_foreign" FOREIGN KEY ("category_id") REFERENCES "library_categories"("id") ON DELETE SET NULL;
ALTER TABLE "library_reading_list_items" ADD CONSTRAINT "library_reading_list_items_item_id_foreign" FOREIGN KEY ("item_id") REFERENCES "library_items"("id") ON DELETE CASCADE;
ALTER TABLE "library_reading_list_items" ADD CONSTRAINT "library_reading_list_items_reading_list_id_foreign" FOREIGN KEY ("reading_list_id") REFERENCES "library_reading_lists"("id") ON DELETE CASCADE;
ALTER TABLE "library_reading_lists" ADD CONSTRAINT "library_reading_lists_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "library_reservations" ADD CONSTRAINT "library_reservations_item_id_foreign" FOREIGN KEY ("item_id") REFERENCES "library_items"("id") ON DELETE CASCADE;
ALTER TABLE "library_reservations" ADD CONSTRAINT "library_reservations_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "library_reviews" ADD CONSTRAINT "library_reviews_item_id_foreign" FOREIGN KEY ("item_id") REFERENCES "library_items"("id") ON DELETE CASCADE;
ALTER TABLE "library_reviews" ADD CONSTRAINT "library_reviews_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "menu_item_user_types" ADD CONSTRAINT "menu_item_user_types_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE;
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "menu_items"("id") ON DELETE CASCADE;
ALTER TABLE "module_attachments" ADD CONSTRAINT "module_attachments_module_id_foreign" FOREIGN KEY ("module_id") REFERENCES "lesson_modules"("id") ON DELETE CASCADE;
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_course_id_foreign" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE;
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_module_id_foreign" FOREIGN KEY ("module_id") REFERENCES "lesson_modules"("id") ON DELETE CASCADE;
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "otp" ADD CONSTRAINT "otp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "pathway_applications" ADD CONSTRAINT "pathway_applications_pathway_id_foreign" FOREIGN KEY ("pathway_id") REFERENCES "pathways"("id") ON DELETE CASCADE;
ALTER TABLE "pathway_applications" ADD CONSTRAINT "pathway_applications_reviewed_by_foreign" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "pathway_applications" ADD CONSTRAINT "pathway_applications_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "pathway_courses" ADD CONSTRAINT "pathway_courses_course_id_foreign" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE;
ALTER TABLE "pathway_courses" ADD CONSTRAINT "pathway_courses_pathway_id_foreign" FOREIGN KEY ("pathway_id") REFERENCES "pathways"("id") ON DELETE CASCADE;
ALTER TABLE "pathway_courses" ADD CONSTRAINT "pathway_courses_prerequisite_course_id_foreign" FOREIGN KEY ("prerequisite_course_id") REFERENCES "courses"("id") ON DELETE SET NULL;
ALTER TABLE "pathway_enrollments" ADD CONSTRAINT "pathway_enrollments_pathway_id_foreign" FOREIGN KEY ("pathway_id") REFERENCES "pathways"("id") ON DELETE CASCADE;
ALTER TABLE "pathway_enrollments" ADD CONSTRAINT "pathway_enrollments_transaction_id_foreign" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL;
ALTER TABLE "pathway_enrollments" ADD CONSTRAINT "pathway_enrollments_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "pathway_progress" ADD CONSTRAINT "pathway_progress_course_id_foreign" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE;
ALTER TABLE "pathway_progress" ADD CONSTRAINT "pathway_progress_enrollment_id_foreign" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE SET NULL;
ALTER TABLE "pathway_progress" ADD CONSTRAINT "pathway_progress_pathway_enrollment_id_foreign" FOREIGN KEY ("pathway_enrollment_id") REFERENCES "pathway_enrollments"("id") ON DELETE CASCADE;
ALTER TABLE "pathways" ADD CONSTRAINT "pathways_category_id_foreign" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL;
ALTER TABLE "pathways" ADD CONSTRAINT "pathways_created_by_foreign" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "pathways" ADD CONSTRAINT "pathways_subscription_tier_id_foreign" FOREIGN KEY ("subscription_tier_id") REFERENCES "subscription_tiers"("id") ON DELETE SET NULL;
ALTER TABLE "payment_providers" ADD CONSTRAINT "payment_providers_created_by_foreign" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "payment_providers" ADD CONSTRAINT "payment_providers_updated_by_foreign" FOREIGN KEY ("updated_by") REFERENCES "users"("id");
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_payroll_run_id_foreign" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE;
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_staff_id_foreign" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE;
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_approved_by_foreign" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_created_by_foreign" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "promotion_displays" ADD CONSTRAINT "promotion_displays_promotion_id_foreign" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE;
ALTER TABLE "promotion_displays" ADD CONSTRAINT "promotion_displays_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_created_by_foreign" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE;
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE;
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "quiz_question_options" ADD CONSTRAINT "quiz_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz_questions"("id") ON DELETE CASCADE;
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE;
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE;
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE;
ALTER TABLE "resource_tags" ADD CONSTRAINT "resource_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "system_tags"("id") ON DELETE CASCADE;
ALTER TABLE "resource_tags" ADD CONSTRAINT "resource_tags_tagged_by_fkey" FOREIGN KEY ("tagged_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "result_batches" ADD CONSTRAINT "result_batches_classroom_id_foreign" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE;
ALTER TABLE "result_batches" ADD CONSTRAINT "result_batches_created_by_foreign" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT;
ALTER TABLE "result_batches" ADD CONSTRAINT "result_batches_grading_scale_id_foreign" FOREIGN KEY ("grading_scale_id") REFERENCES "grading_scales"("id") ON DELETE RESTRICT;
ALTER TABLE "result_batches" ADD CONSTRAINT "result_batches_subject_group_id_fkey" FOREIGN KEY ("subject_group_id") REFERENCES "subject_groups"("id");
ALTER TABLE "result_batches" ADD CONSTRAINT "result_batches_updated_by_foreign" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "shop_cart_items" ADD CONSTRAINT "shop_cart_items_cart_id_foreign" FOREIGN KEY ("cart_id") REFERENCES "shop_carts"("id") ON DELETE CASCADE;
ALTER TABLE "shop_cart_items" ADD CONSTRAINT "shop_cart_items_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "shop_products"("id") ON DELETE CASCADE;
ALTER TABLE "shop_carts" ADD CONSTRAINT "shop_carts_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "shop_categories" ADD CONSTRAINT "shop_categories_parent_id_foreign" FOREIGN KEY ("parent_id") REFERENCES "shop_categories"("id") ON DELETE SET NULL;
ALTER TABLE "shop_order_items" ADD CONSTRAINT "shop_order_items_order_id_foreign" FOREIGN KEY ("order_id") REFERENCES "shop_orders"("id") ON DELETE CASCADE;
ALTER TABLE "shop_order_items" ADD CONSTRAINT "shop_order_items_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "shop_products"("id") ON DELETE RESTRICT;
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_transaction_id_foreign" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL;
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "shop_product_images" ADD CONSTRAINT "shop_product_images_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "shop_products"("id") ON DELETE CASCADE;
ALTER TABLE "shop_product_reviews" ADD CONSTRAINT "shop_product_reviews_order_id_foreign" FOREIGN KEY ("order_id") REFERENCES "shop_orders"("id") ON DELETE SET NULL;
ALTER TABLE "shop_product_reviews" ADD CONSTRAINT "shop_product_reviews_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "shop_products"("id") ON DELETE CASCADE;
ALTER TABLE "shop_product_reviews" ADD CONSTRAINT "shop_product_reviews_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "shop_product_tags" ADD CONSTRAINT "shop_product_tags_product_id_foreign" FOREIGN KEY ("product_id") REFERENCES "shop_products"("id") ON DELETE CASCADE;
ALTER TABLE "shop_product_tags" ADD CONSTRAINT "shop_product_tags_tag_id_foreign" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE;
ALTER TABLE "shop_products" ADD CONSTRAINT "shop_products_category_id_foreign" FOREIGN KEY ("category_id") REFERENCES "shop_categories"("id") ON DELETE SET NULL;
ALTER TABLE "shop_transactions" ADD CONSTRAINT "shop_transactions_order_id_foreign" FOREIGN KEY ("order_id") REFERENCES "shop_orders"("id") ON DELETE CASCADE;
ALTER TABLE "shop_transactions" ADD CONSTRAINT "shop_transactions_transaction_id_foreign" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL;
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "staff_accounts" ADD CONSTRAINT "staff_accounts_staff_id_foreign" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE;
ALTER TABLE "staff_salaries" ADD CONSTRAINT "staff_salaries_staff_id_foreign" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE;
ALTER TABLE "student_results" ADD CONSTRAINT "student_results_classroom_id_foreign" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE;
ALTER TABLE "student_results" ADD CONSTRAINT "student_results_student_id_foreign" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "student_results" ADD CONSTRAINT "student_results_subject_id_foreign" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE;
ALTER TABLE "student_results" ADD CONSTRAINT "student_results_teacher_id_foreign" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "subject_group_subjects" ADD CONSTRAINT "subject_group_subjects_subject_group_id_fkey" FOREIGN KEY ("subject_group_id") REFERENCES "subject_groups"("id") ON DELETE CASCADE;
ALTER TABLE "subject_group_subjects" ADD CONSTRAINT "subject_group_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE;
ALTER TABLE "subject_groups" ADD CONSTRAINT "subject_groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");
ALTER TABLE "system_tags" ADD CONSTRAINT "system_tags_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "tag_categories"("id") ON DELETE SET NULL;
ALTER TABLE "system_tags" ADD CONSTRAINT "system_tags_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_course_id_foreign" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_foreign" FOREIGN KEY ("order_id") REFERENCES "shop_orders"("id") ON DELETE SET NULL;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_personalisations" ADD CONSTRAINT "user_personalisations_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_storage" ADD CONSTRAINT "user_storage_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_tier_id_foreign" FOREIGN KEY ("tier_id") REFERENCES "subscription_tiers"("id") ON DELETE CASCADE;
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_wishlist" ADD CONSTRAINT "user_wishlist_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_xp" ADD CONSTRAINT "user_xp_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_active_subscription_id_foreign" FOREIGN KEY ("active_subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE SET NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_parent_id_foreign" FOREIGN KEY ("parent_id") REFERENCES "parents"("id") ON DELETE SET NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL;
ALTER TABLE "users_permissions" ADD CONSTRAINT "users_permissions_granted_by_foreign" FOREIGN KEY ("granted_by") REFERENCES "users"("id");
ALTER TABLE "users_permissions" ADD CONSTRAINT "users_permissions_permission_id_foreign" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE;
ALTER TABLE "users_permissions" ADD CONSTRAINT "users_permissions_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "work_profiles" ADD CONSTRAINT "work_profiles_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
CREATE INDEX "announcement_views_announcement_id_is_dismissed_index" ON "announcement_views" ("announcement_id","is_dismissed");
CREATE UNIQUE INDEX "announcement_views_announcement_id_user_id_unique" ON "announcement_views" ("announcement_id","user_id");
CREATE UNIQUE INDEX "announcement_views_pkey" ON "announcement_views" ("id");
CREATE INDEX "announcement_views_user_id_index" ON "announcement_views" ("user_id");
CREATE INDEX "announcements_is_active_start_date_end_date_index" ON "announcements" ("is_active","start_date","end_date");
CREATE UNIQUE INDEX "announcements_pkey" ON "announcements" ("id");
CREATE INDEX "announcements_priority_index" ON "announcements" ("priority");
CREATE INDEX "announcements_target_audience_index" ON "announcements" ("target_audience");
CREATE UNIQUE INDEX "assignment_submissions_pkey" ON "assignment_submissions" ("id");
CREATE UNIQUE INDEX "assignments_pkey" ON "assignments" ("id");
CREATE UNIQUE INDEX "audit_logs_pkey" ON "audit_logs" ("id");
CREATE INDEX "idx_audit_logs_action" ON "audit_logs" ("action");
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" ("created_at");
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs" ("user_id");
CREATE UNIQUE INDEX "categories_name_key" ON "categories" ("name");
CREATE UNIQUE INDEX "categories_pkey" ON "categories" ("id");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories" ("slug");
CREATE INDEX "certificates_certificate_number_index" ON "certificates" ("certificate_number");
CREATE UNIQUE INDEX "certificates_certificate_number_unique" ON "certificates" ("certificate_number");
CREATE INDEX "certificates_course_id_index" ON "certificates" ("course_id");
CREATE UNIQUE INDEX "certificates_pkey" ON "certificates" ("id");
CREATE UNIQUE INDEX "certificates_user_id_course_id_unique" ON "certificates" ("user_id","course_id");
CREATE INDEX "certificates_user_id_index" ON "certificates" ("user_id");
CREATE INDEX "classroom_students_classroom_id_index" ON "classroom_students" ("classroom_id");
CREATE UNIQUE INDEX "classroom_students_classroom_id_student_id_unique" ON "classroom_students" ("classroom_id","student_id");
CREATE INDEX "classroom_students_enrollment_number_index" ON "classroom_students" ("enrollment_number");
CREATE UNIQUE INDEX "classroom_students_pkey" ON "classroom_students" ("id");
CREATE INDEX "classroom_students_status_index" ON "classroom_students" ("status");
CREATE INDEX "classroom_students_student_id_index" ON "classroom_students" ("student_id");
CREATE INDEX "classroom_teachers_classroom_id_index" ON "classroom_teachers" ("classroom_id");
CREATE UNIQUE INDEX "classroom_teachers_classroom_id_teacher_id_unique" ON "classroom_teachers" ("classroom_id","teacher_id");
CREATE INDEX "classroom_teachers_is_primary_index" ON "classroom_teachers" ("is_primary");
CREATE UNIQUE INDEX "classroom_teachers_pkey" ON "classroom_teachers" ("id");
CREATE INDEX "classroom_teachers_status_index" ON "classroom_teachers" ("status");
CREATE INDEX "classroom_teachers_teacher_id_index" ON "classroom_teachers" ("teacher_id");
CREATE INDEX "classrooms_academic_year_index" ON "classrooms" ("academic_year");
CREATE INDEX "classrooms_class_teacher_id_index" ON "classrooms" ("class_teacher_id");
CREATE INDEX "classrooms_code_index" ON "classrooms" ("code");
CREATE UNIQUE INDEX "classrooms_code_unique" ON "classrooms" ("code");
CREATE INDEX "classrooms_is_active_index" ON "classrooms" ("is_active");
CREATE INDEX "classrooms_level_index" ON "classrooms" ("level");
CREATE UNIQUE INDEX "classrooms_pkey" ON "classrooms" ("id");
CREATE INDEX "classrooms_type_index" ON "classrooms" ("type");
CREATE INDEX "contact_submissions_created_at_index" ON "contact_submissions" ("created_at");
CREATE INDEX "contact_submissions_email_index" ON "contact_submissions" ("email");
CREATE UNIQUE INDEX "contact_submissions_pkey" ON "contact_submissions" ("id");
CREATE INDEX "contact_submissions_status_index" ON "contact_submissions" ("status");
CREATE UNIQUE INDEX "course_prerequisites_pkey" ON "course_prerequisites" ("course_id","prerequisite_course_id");
CREATE UNIQUE INDEX "course_reviews_pkey" ON "course_reviews" ("id");
CREATE UNIQUE INDEX "unique_user_course_review" ON "course_reviews" ("user_id","course_id");
CREATE UNIQUE INDEX "course_tags_pkey" ON "course_tags" ("course_id","tag_id");
CREATE UNIQUE INDEX "courses_pkey" ON "courses" ("id");
CREATE UNIQUE INDEX "courses_slug_key" ON "courses" ("slug");
CREATE INDEX "idx_courses_category_id" ON "courses" ("category_id");
CREATE INDEX "idx_courses_created_at" ON "courses" ("created_at");
CREATE INDEX "idx_courses_instructor_id" ON "courses" ("instructor_id");
CREATE INDEX "idx_courses_is_published" ON "courses" ("is_published");
CREATE INDEX "idx_courses_slug" ON "courses" ("slug");
CREATE INDEX "idx_courses_subscription_tier_id" ON "courses" ("subscription_tier_id");
CREATE INDEX "document_folders_deleted_at_index" ON "document_folders" ("deleted_at");
CREATE INDEX "document_folders_parent_folder_id_index" ON "document_folders" ("parent_folder_id");
CREATE UNIQUE INDEX "document_folders_pkey" ON "document_folders" ("id");
CREATE INDEX "document_folders_user_id_index" ON "document_folders" ("user_id");
CREATE UNIQUE INDEX "document_folders_user_id_parent_folder_id_name_unique" ON "document_folders" ("user_id","parent_folder_id","name");
CREATE INDEX "document_shares_access_token_index" ON "document_shares" ("access_token");
CREATE UNIQUE INDEX "document_shares_access_token_unique" ON "document_shares" ("access_token");
CREATE INDEX "document_shares_document_id_index" ON "document_shares" ("document_id");
CREATE UNIQUE INDEX "document_shares_pkey" ON "document_shares" ("id");
CREATE INDEX "document_shares_recipient_email_index" ON "document_shares" ("recipient_email");
CREATE INDEX "document_shares_share_type_index" ON "document_shares" ("share_type");
CREATE INDEX "document_shares_shared_by_index" ON "document_shares" ("shared_by");
CREATE INDEX "document_shares_shared_with_user_id_index" ON "document_shares" ("shared_with_user_id");
CREATE INDEX "document_versions_document_id_index" ON "document_versions" ("document_id");
CREATE UNIQUE INDEX "document_versions_pkey" ON "document_versions" ("id");
CREATE INDEX "document_versions_uploaded_by_index" ON "document_versions" ("uploaded_by");
CREATE INDEX "documents_created_at_index" ON "documents" ("created_at");
CREATE INDEX "documents_deleted_at_index" ON "documents" ("deleted_at");
CREATE INDEX "documents_file_type_index" ON "documents" ("file_type");
CREATE INDEX "documents_folder_id_index" ON "documents" ("folder_id");
CREATE INDEX "documents_is_public_index" ON "documents" ("is_public");
CREATE UNIQUE INDEX "documents_pkey" ON "documents" ("id");
CREATE INDEX "documents_user_id_index" ON "documents" ("user_id");
CREATE UNIQUE INDEX "enrollments_pkey" ON "enrollments" ("id");
CREATE INDEX "enrollments_transaction_id_index" ON "enrollments" ("transaction_id");
CREATE INDEX "idx_enrollments_course_id" ON "enrollments" ("course_id");
CREATE INDEX "idx_enrollments_status" ON "enrollments" ("status");
CREATE INDEX "idx_enrollments_user_id" ON "enrollments" ("user_id");
CREATE UNIQUE INDEX "unique_user_course_enrollment" ON "enrollments" ("user_id","course_id");
CREATE UNIQUE INDEX "grading_scales_pkey" ON "grading_scales" ("id");
CREATE UNIQUE INDEX "institution_settings_id_unique" ON "institution_settings" ("id");
CREATE UNIQUE INDEX "institution_settings_pkey" ON "institution_settings" ("id");
CREATE INDEX "job_applications_email_index" ON "job_applications" ("email");
CREATE INDEX "job_applications_job_id_index" ON "job_applications" ("job_id");
CREATE UNIQUE INDEX "job_applications_pkey" ON "job_applications" ("id");
CREATE INDEX "job_applications_status_index" ON "job_applications" ("status");
CREATE INDEX "job_applications_user_id_index" ON "job_applications" ("user_id");
CREATE INDEX "idx_job_profiles_user_id" ON "job_profiles" ("user_id");
CREATE UNIQUE INDEX "job_profiles_pkey" ON "job_profiles" ("id");
CREATE UNIQUE INDEX "job_profiles_user_id_unique" ON "job_profiles" ("user_id");
CREATE INDEX "jobs_created_at_index" ON "jobs" ("created_at");
CREATE INDEX "jobs_is_active_index" ON "jobs" ("is_active");
CREATE UNIQUE INDEX "jobs_pkey" ON "jobs" ("id");
CREATE INDEX "jobs_type_index" ON "jobs" ("type");
CREATE UNIQUE INDEX "knex_migrations_pkey" ON "knex_migrations" ("id");
CREATE UNIQUE INDEX "knex_migrations_lock_pkey" ON "knex_migrations_lock" ("index");
CREATE INDEX "lesson_attachments_lesson_id_display_order_index" ON "lesson_attachments" ("lesson_id","display_order");
CREATE INDEX "lesson_attachments_lesson_id_index" ON "lesson_attachments" ("lesson_id");
CREATE UNIQUE INDEX "lesson_attachments_pkey" ON "lesson_attachments" ("id");
CREATE INDEX "idx_modules_lesson" ON "lesson_modules" ("lesson_id");
CREATE INDEX "idx_modules_lesson_order" ON "lesson_modules" ("lesson_id","order_index");
CREATE INDEX "idx_modules_slug" ON "lesson_modules" ("slug");
CREATE UNIQUE INDEX "lesson_modules_pkey" ON "lesson_modules" ("id");
CREATE UNIQUE INDEX "unique_module_slug_per_lesson" ON "lesson_modules" ("lesson_id","slug");
CREATE INDEX "idx_lesson_progress_enrollment_id" ON "lesson_progress" ("enrollment_id");
CREATE INDEX "idx_lesson_progress_user_id" ON "lesson_progress" ("user_id");
CREATE UNIQUE INDEX "lesson_progress_pkey" ON "lesson_progress" ("id");
CREATE UNIQUE INDEX "unique_user_lesson_progress" ON "lesson_progress" ("user_id","lesson_id");
CREATE INDEX "idx_lessons_course_id" ON "lessons" ("course_id");
CREATE INDEX "idx_lessons_course_version" ON "lessons" ("course_id","version");
CREATE INDEX "idx_lessons_display_order" ON "lessons" ("course_id","display_order");
CREATE INDEX "idx_lessons_previous_version" ON "lessons" ("previous_version_id");
CREATE INDEX "idx_lessons_scheduled_publish" ON "lessons" ("scheduled_publish_at");
CREATE UNIQUE INDEX "lessons_pkey" ON "lessons" ("id");
CREATE UNIQUE INDEX "unique_course_lesson_slug" ON "lessons" ("course_id","slug");
CREATE INDEX "library_activity_log_action_index" ON "library_activity_log" ("action");
CREATE INDEX "library_activity_log_created_at_index" ON "library_activity_log" ("created_at");
CREATE INDEX "library_activity_log_item_id_index" ON "library_activity_log" ("item_id");
CREATE UNIQUE INDEX "library_activity_log_pkey" ON "library_activity_log" ("id");
CREATE INDEX "library_activity_log_user_id_index" ON "library_activity_log" ("user_id");
CREATE INDEX "library_borrowing_due_date_index" ON "library_borrowing" ("due_date");
CREATE INDEX "library_borrowing_item_id_index" ON "library_borrowing" ("item_id");
CREATE INDEX "library_borrowing_item_id_user_id_index" ON "library_borrowing" ("item_id","user_id");
CREATE UNIQUE INDEX "library_borrowing_pkey" ON "library_borrowing" ("id");
CREATE INDEX "library_borrowing_status_index" ON "library_borrowing" ("status");
CREATE INDEX "library_borrowing_user_id_index" ON "library_borrowing" ("user_id");
CREATE INDEX "library_categories_is_active_index" ON "library_categories" ("is_active");
CREATE UNIQUE INDEX "library_categories_name_unique" ON "library_categories" ("name");
CREATE UNIQUE INDEX "library_categories_pkey" ON "library_categories" ("id");
CREATE INDEX "library_categories_slug_index" ON "library_categories" ("slug");
CREATE UNIQUE INDEX "library_categories_slug_unique" ON "library_categories" ("slug");
CREATE INDEX "library_items_author_index" ON "library_items" ("author");
CREATE INDEX "library_items_category_id_index" ON "library_items" ("category_id");
CREATE INDEX "library_items_is_featured_index" ON "library_items" ("is_featured");
CREATE INDEX "library_items_isbn_index" ON "library_items" ("isbn");
CREATE UNIQUE INDEX "library_items_isbn_unique" ON "library_items" ("isbn");
CREATE INDEX "library_items_item_type_index" ON "library_items" ("item_type");
CREATE UNIQUE INDEX "library_items_pkey" ON "library_items" ("id");
CREATE INDEX "library_items_status_index" ON "library_items" ("status");
CREATE INDEX "library_items_title_index" ON "library_items" ("title");
CREATE INDEX "library_reading_list_items_item_id_index" ON "library_reading_list_items" ("item_id");
CREATE UNIQUE INDEX "library_reading_list_items_pkey" ON "library_reading_list_items" ("id");
CREATE INDEX "library_reading_list_items_reading_list_id_index" ON "library_reading_list_items" ("reading_list_id");
CREATE UNIQUE INDEX "library_reading_list_items_reading_list_id_item_id_unique" ON "library_reading_list_items" ("reading_list_id","item_id");
CREATE INDEX "library_reading_lists_is_public_index" ON "library_reading_lists" ("is_public");
CREATE UNIQUE INDEX "library_reading_lists_pkey" ON "library_reading_lists" ("id");
CREATE INDEX "library_reading_lists_user_id_index" ON "library_reading_lists" ("user_id");
CREATE INDEX "library_reservations_expires_at_index" ON "library_reservations" ("expires_at");
CREATE INDEX "library_reservations_item_id_index" ON "library_reservations" ("item_id");
CREATE UNIQUE INDEX "library_reservations_pkey" ON "library_reservations" ("id");
CREATE INDEX "library_reservations_status_index" ON "library_reservations" ("status");
CREATE INDEX "library_reservations_user_id_index" ON "library_reservations" ("user_id");
CREATE INDEX "library_reviews_is_approved_index" ON "library_reviews" ("is_approved");
CREATE INDEX "library_reviews_item_id_index" ON "library_reviews" ("item_id");
CREATE UNIQUE INDEX "library_reviews_item_id_user_id_unique" ON "library_reviews" ("item_id","user_id");
CREATE UNIQUE INDEX "library_reviews_pkey" ON "library_reviews" ("id");
CREATE INDEX "library_reviews_user_id_index" ON "library_reviews" ("user_id");
CREATE INDEX "idx_menu_user_types_menu" ON "menu_item_user_types" ("menu_item_id");
CREATE INDEX "idx_menu_user_types_type" ON "menu_item_user_types" ("user_type");
CREATE UNIQUE INDEX "menu_item_user_types_menu_item_id_user_type_key" ON "menu_item_user_types" ("menu_item_id","user_type");
CREATE UNIQUE INDEX "menu_item_user_types_pkey" ON "menu_item_user_types" ("id");
CREATE INDEX "idx_menu_items_active" ON "menu_items" ("is_active");
CREATE INDEX "idx_menu_items_key" ON "menu_items" ("menu_key");
CREATE INDEX "idx_menu_items_order" ON "menu_items" ("display_order");
CREATE INDEX "idx_menu_items_parent" ON "menu_items" ("parent_id");
CREATE UNIQUE INDEX "menu_items_menu_key_key" ON "menu_items" ("menu_key");
CREATE UNIQUE INDEX "menu_items_pkey" ON "menu_items" ("id");
CREATE INDEX "idx_menu_visibility_user_type" ON "menu_visibility_settings" ("user_type");
CREATE INDEX "idx_menu_visibility_visible" ON "menu_visibility_settings" ("is_visible");
CREATE UNIQUE INDEX "menu_visibility_settings_pkey" ON "menu_visibility_settings" ("id");
CREATE UNIQUE INDEX "menu_visibility_settings_user_type_menu_key_key" ON "menu_visibility_settings" ("user_type","menu_key");
CREATE INDEX "idx_attachments_module" ON "module_attachments" ("module_id");
CREATE INDEX "idx_attachments_module_order" ON "module_attachments" ("module_id","order_index");
CREATE UNIQUE INDEX "module_attachments_pkey" ON "module_attachments" ("id");
CREATE INDEX "module_progress_is_completed_index" ON "module_progress" ("is_completed");
CREATE INDEX "module_progress_module_id_index" ON "module_progress" ("module_id");
CREATE UNIQUE INDEX "module_progress_pkey" ON "module_progress" ("id");
CREATE INDEX "module_progress_user_id_course_id_index" ON "module_progress" ("user_id","course_id");
CREATE UNIQUE INDEX "module_progress_user_id_module_id_unique" ON "module_progress" ("user_id","module_id");
CREATE UNIQUE INDEX "notifications_pkey" ON "notifications" ("id");
CREATE UNIQUE INDEX "otp_pkey" ON "otp" ("id");
CREATE INDEX "otp_codes_email_code_is_used_index" ON "otp_codes" ("email","code","is_used");
CREATE INDEX "otp_codes_email_index" ON "otp_codes" ("email");
CREATE INDEX "otp_codes_expires_at_is_used_index" ON "otp_codes" ("expires_at","is_used");
CREATE UNIQUE INDEX "otp_codes_pkey" ON "otp_codes" ("id");
CREATE UNIQUE INDEX "parents_email_unique" ON "parents" ("email");
CREATE UNIQUE INDEX "parents_pkey" ON "parents" ("id");
CREATE UNIQUE INDEX "password_reset_tokens_pkey" ON "password_reset_tokens" ("id");
CREATE INDEX "pathway_applications_applied_at_index" ON "pathway_applications" ("applied_at");
CREATE INDEX "pathway_applications_pathway_id_index" ON "pathway_applications" ("pathway_id");
CREATE UNIQUE INDEX "pathway_applications_pkey" ON "pathway_applications" ("id");
CREATE INDEX "pathway_applications_status_index" ON "pathway_applications" ("status");
CREATE INDEX "pathway_applications_user_id_index" ON "pathway_applications" ("user_id");
CREATE UNIQUE INDEX "unique_user_pathway_application" ON "pathway_applications" ("user_id","pathway_id");
CREATE INDEX "pathway_courses_course_id_index" ON "pathway_courses" ("course_id");
CREATE UNIQUE INDEX "pathway_courses_pathway_id_course_id_unique" ON "pathway_courses" ("pathway_id","course_id");
CREATE INDEX "pathway_courses_pathway_id_index" ON "pathway_courses" ("pathway_id");
CREATE UNIQUE INDEX "pathway_courses_pkey" ON "pathway_courses" ("id");
CREATE INDEX "pathway_courses_sequence_order_index" ON "pathway_courses" ("sequence_order");
CREATE INDEX "pathway_enrollments_enrolled_at_index" ON "pathway_enrollments" ("enrolled_at");
CREATE INDEX "pathway_enrollments_pathway_id_index" ON "pathway_enrollments" ("pathway_id");
CREATE UNIQUE INDEX "pathway_enrollments_pkey" ON "pathway_enrollments" ("id");
CREATE INDEX "pathway_enrollments_status_index" ON "pathway_enrollments" ("status");
CREATE INDEX "pathway_enrollments_user_id_index" ON "pathway_enrollments" ("user_id");
CREATE UNIQUE INDEX "pathway_enrollments_user_id_pathway_id_unique" ON "pathway_enrollments" ("user_id","pathway_id");
CREATE INDEX "pathway_progress_course_id_index" ON "pathway_progress" ("course_id");
CREATE INDEX "pathway_progress_is_completed_index" ON "pathway_progress" ("is_completed");
CREATE UNIQUE INDEX "pathway_progress_pathway_enrollment_id_course_id_unique" ON "pathway_progress" ("pathway_enrollment_id","course_id");
CREATE INDEX "pathway_progress_pathway_enrollment_id_index" ON "pathway_progress" ("pathway_enrollment_id");
CREATE UNIQUE INDEX "pathway_progress_pkey" ON "pathway_progress" ("id");
CREATE INDEX "idx_pathways_subscription_tier_id" ON "pathways" ("subscription_tier_id");
CREATE INDEX "pathways_career_focus_index" ON "pathways" ("career_focus");
CREATE INDEX "pathways_category_id_index" ON "pathways" ("category_id");
CREATE INDEX "pathways_created_by_index" ON "pathways" ("created_by");
CREATE INDEX "pathways_is_published_index" ON "pathways" ("is_published");
CREATE UNIQUE INDEX "pathways_pkey" ON "pathways" ("id");
CREATE INDEX "pathways_slug_index" ON "pathways" ("slug");
CREATE UNIQUE INDEX "pathways_slug_unique" ON "pathways" ("slug");
CREATE INDEX "payment_providers_is_active_index" ON "payment_providers" ("is_active");
CREATE UNIQUE INDEX "payment_providers_pkey" ON "payment_providers" ("id");
CREATE INDEX "payment_providers_provider_name_index" ON "payment_providers" ("provider_name");
CREATE UNIQUE INDEX "payment_providers_provider_name_unique" ON "payment_providers" ("provider_name");
CREATE UNIQUE INDEX "payment_webhooks_pkey" ON "payment_webhooks" ("id");
CREATE INDEX "payroll_items_payroll_run_id_index" ON "payroll_items" ("payroll_run_id");
CREATE UNIQUE INDEX "payroll_items_payroll_run_id_staff_id_unique" ON "payroll_items" ("payroll_run_id","staff_id");
CREATE UNIQUE INDEX "payroll_items_pkey" ON "payroll_items" ("id");
CREATE INDEX "payroll_items_staff_id_index" ON "payroll_items" ("staff_id");
CREATE UNIQUE INDEX "payroll_runs_payroll_month_unique" ON "payroll_runs" ("payroll_month");
CREATE UNIQUE INDEX "payroll_runs_pkey" ON "payroll_runs" ("id");
CREATE INDEX "payroll_runs_status_index" ON "payroll_runs" ("status");
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions" ("name");
CREATE UNIQUE INDEX "permissions_pkey" ON "permissions" ("id");
CREATE UNIQUE INDEX "unique_permission" ON "permissions" ("resource","action");
CREATE UNIQUE INDEX "promotion_displays_pkey" ON "promotion_displays" ("id");
CREATE INDEX "promotion_displays_promotion_id_displayed_at_index" ON "promotion_displays" ("promotion_id","displayed_at");
CREATE INDEX "promotion_displays_promotion_id_user_id_index" ON "promotion_displays" ("promotion_id","user_id");
CREATE INDEX "promotion_displays_user_id_index" ON "promotion_displays" ("user_id");
CREATE INDEX "promotions_display_type_index" ON "promotions" ("display_type");
CREATE INDEX "promotions_is_active_start_date_end_date_index" ON "promotions" ("is_active","start_date","end_date");
CREATE UNIQUE INDEX "promotions_pkey" ON "promotions" ("id");
CREATE INDEX "promotions_priority_index" ON "promotions" ("priority");
CREATE INDEX "promotions_target_audience_index" ON "promotions" ("target_audience");
CREATE UNIQUE INDEX "quiz_attempts_pkey" ON "quiz_attempts" ("id");
CREATE UNIQUE INDEX "quiz_question_options_pkey" ON "quiz_question_options" ("id");
CREATE UNIQUE INDEX "quiz_questions_pkey" ON "quiz_questions" ("id");
CREATE UNIQUE INDEX "quizzes_pkey" ON "quizzes" ("id");
CREATE INDEX "idx_resource_tags_resource" ON "resource_tags" ("resource_type","resource_id");
CREATE INDEX "idx_resource_tags_tag_id" ON "resource_tags" ("tag_id");
CREATE INDEX "idx_resource_tags_tagged_by" ON "resource_tags" ("tagged_by");
CREATE INDEX "idx_resource_tags_type" ON "resource_tags" ("resource_type");
CREATE UNIQUE INDEX "resource_tags_pkey" ON "resource_tags" ("id");
CREATE UNIQUE INDEX "unique_resource_tag" ON "resource_tags" ("resource_type","resource_id","tag_id");
CREATE INDEX "idx_result_batches_classroom_year_term" ON "result_batches" ("classroom_id","academic_year","term");
CREATE INDEX "idx_result_batches_created_by" ON "result_batches" ("created_by");
CREATE INDEX "idx_result_batches_status" ON "result_batches" ("status");
CREATE UNIQUE INDEX "result_batches_batch_code_unique" ON "result_batches" ("batch_code");
CREATE INDEX "result_batches_classroom_id_academic_year_term_index" ON "result_batches" ("classroom_id","academic_year","term");
CREATE INDEX "result_batches_created_by_index" ON "result_batches" ("created_by");
CREATE UNIQUE INDEX "result_batches_pkey" ON "result_batches" ("id");
CREATE INDEX "result_batches_status_index" ON "result_batches" ("status");
CREATE UNIQUE INDEX "role_permissions_pkey" ON "role_permissions" ("id");
CREATE UNIQUE INDEX "unique_role_permission" ON "role_permissions" ("role_id","permission_id");
CREATE UNIQUE INDEX "roles_name_key" ON "roles" ("name");
CREATE UNIQUE INDEX "roles_pkey" ON "roles" ("id");
CREATE UNIQUE INDEX "sessions_pkey" ON "sessions" ("id");
CREATE INDEX "shop_cart_items_cart_id_index" ON "shop_cart_items" ("cart_id");
CREATE UNIQUE INDEX "shop_cart_items_cart_id_product_id_unique" ON "shop_cart_items" ("cart_id","product_id");
CREATE UNIQUE INDEX "shop_cart_items_pkey" ON "shop_cart_items" ("id");
CREATE INDEX "shop_cart_items_product_id_index" ON "shop_cart_items" ("product_id");
CREATE UNIQUE INDEX "shop_carts_pkey" ON "shop_carts" ("id");
CREATE INDEX "shop_carts_session_id_index" ON "shop_carts" ("session_id");
CREATE INDEX "shop_carts_user_id_index" ON "shop_carts" ("user_id");
CREATE INDEX "shop_categories_is_active_index" ON "shop_categories" ("is_active");
CREATE INDEX "shop_categories_parent_id_index" ON "shop_categories" ("parent_id");
CREATE UNIQUE INDEX "shop_categories_pkey" ON "shop_categories" ("id");
CREATE INDEX "shop_categories_slug_index" ON "shop_categories" ("slug");
CREATE UNIQUE INDEX "shop_categories_slug_unique" ON "shop_categories" ("slug");
CREATE INDEX "shop_order_items_order_id_index" ON "shop_order_items" ("order_id");
CREATE UNIQUE INDEX "shop_order_items_pkey" ON "shop_order_items" ("id");
CREATE INDEX "shop_order_items_product_id_index" ON "shop_order_items" ("product_id");
CREATE INDEX "shop_orders_created_at_index" ON "shop_orders" ("created_at");
CREATE INDEX "shop_orders_order_number_index" ON "shop_orders" ("order_number");
CREATE UNIQUE INDEX "shop_orders_order_number_unique" ON "shop_orders" ("order_number");
CREATE INDEX "shop_orders_payment_status_index" ON "shop_orders" ("payment_status");
CREATE UNIQUE INDEX "shop_orders_pkey" ON "shop_orders" ("id");
CREATE INDEX "shop_orders_status_index" ON "shop_orders" ("status");
CREATE INDEX "shop_orders_user_id_index" ON "shop_orders" ("user_id");
CREATE UNIQUE INDEX "shop_product_images_pkey" ON "shop_product_images" ("id");
CREATE INDEX "shop_product_images_product_id_display_order_index" ON "shop_product_images" ("product_id","display_order");
CREATE INDEX "shop_product_images_product_id_index" ON "shop_product_images" ("product_id");
CREATE INDEX "shop_product_images_product_id_is_primary_index" ON "shop_product_images" ("product_id","is_primary");
CREATE UNIQUE INDEX "shop_product_reviews_pkey" ON "shop_product_reviews" ("id");
CREATE INDEX "shop_product_reviews_product_id_index" ON "shop_product_reviews" ("product_id");
CREATE INDEX "shop_product_reviews_rating_index" ON "shop_product_reviews" ("rating");
CREATE UNIQUE INDEX "shop_product_reviews_user_id_product_id_unique" ON "shop_product_reviews" ("user_id","product_id");
CREATE UNIQUE INDEX "shop_product_tags_pkey" ON "shop_product_tags" ("product_id","tag_id");
CREATE INDEX "shop_products_category_id_index" ON "shop_products" ("category_id");
CREATE INDEX "shop_products_is_published_index" ON "shop_products" ("is_published");
CREATE INDEX "shop_products_is_published_stock_status_index" ON "shop_products" ("is_published","stock_status");
CREATE UNIQUE INDEX "shop_products_pkey" ON "shop_products" ("id");
CREATE INDEX "shop_products_sku_index" ON "shop_products" ("sku");
CREATE UNIQUE INDEX "shop_products_sku_unique" ON "shop_products" ("sku");
CREATE INDEX "shop_products_slug_index" ON "shop_products" ("slug");
CREATE UNIQUE INDEX "shop_products_slug_unique" ON "shop_products" ("slug");
CREATE INDEX "shop_transactions_order_id_index" ON "shop_transactions" ("order_id");
CREATE UNIQUE INDEX "shop_transactions_pkey" ON "shop_transactions" ("id");
CREATE INDEX "shop_transactions_transaction_id_index" ON "shop_transactions" ("transaction_id");
CREATE INDEX "staff_department_index" ON "staff" ("department");
CREATE INDEX "staff_email_index" ON "staff" ("email");
CREATE UNIQUE INDEX "staff_email_unique" ON "staff" ("email");
CREATE INDEX "staff_employment_status_index" ON "staff" ("employment_status");
CREATE INDEX "staff_first_name_last_name_index" ON "staff" ("first_name","last_name");
CREATE INDEX "staff_nin_index" ON "staff" ("nin");
CREATE UNIQUE INDEX "staff_pkey" ON "staff" ("id");
CREATE INDEX "staff_staff_id_index" ON "staff" ("staff_id");
CREATE UNIQUE INDEX "staff_staff_id_unique" ON "staff" ("staff_id");
CREATE UNIQUE INDEX "staff_accounts_pkey" ON "staff_accounts" ("id");
CREATE INDEX "staff_accounts_staff_id_index" ON "staff_accounts" ("staff_id");
CREATE INDEX "staff_salaries_is_active_index" ON "staff_salaries" ("is_active");
CREATE UNIQUE INDEX "staff_salaries_pkey" ON "staff_salaries" ("id");
CREATE INDEX "staff_salaries_staff_id_index" ON "staff_salaries" ("staff_id");
CREATE INDEX "student_results_classroom_id_academic_year_term_index" ON "student_results" ("classroom_id","academic_year","term");
CREATE UNIQUE INDEX "student_results_pkey" ON "student_results" ("id");
CREATE INDEX "student_results_student_id_index" ON "student_results" ("student_id");
CREATE UNIQUE INDEX "unique_student_result" ON "student_results" ("classroom_id","student_id","subject_id","academic_year","term");
CREATE UNIQUE INDEX "subject_group_subjects_pkey" ON "subject_group_subjects" ("id");
CREATE UNIQUE INDEX "subject_group_subjects_subject_group_id_subject_id_key" ON "subject_group_subjects" ("subject_group_id","subject_id");
CREATE UNIQUE INDEX "subject_groups_pkey" ON "subject_groups" ("id");
CREATE UNIQUE INDEX "subjects_code_unique" ON "subjects" ("code");
CREATE UNIQUE INDEX "subjects_pkey" ON "subjects" ("id");
CREATE INDEX "subscription_tiers_is_active_sort_order_index" ON "subscription_tiers" ("is_active","sort_order");
CREATE UNIQUE INDEX "subscription_tiers_pkey" ON "subscription_tiers" ("id");
CREATE INDEX "subscription_tiers_slug_index" ON "subscription_tiers" ("slug");
CREATE UNIQUE INDEX "subscription_tiers_slug_unique" ON "subscription_tiers" ("slug");
CREATE INDEX "idx_system_tags_created_by" ON "system_tags" ("created_by");
CREATE INDEX "idx_system_tags_key" ON "system_tags" ("tag_key");
CREATE INDEX "idx_system_tags_key_value" ON "system_tags" ("tag_key","tag_value");
CREATE INDEX "idx_system_tags_value" ON "system_tags" ("tag_value");
CREATE UNIQUE INDEX "system_tags_pkey" ON "system_tags" ("id");
CREATE UNIQUE INDEX "unique_tag_key_value" ON "system_tags" ("tag_key","tag_value");
CREATE UNIQUE INDEX "tag_categories_name_key" ON "tag_categories" ("name");
CREATE UNIQUE INDEX "tag_categories_pkey" ON "tag_categories" ("id");
CREATE UNIQUE INDEX "tags_name_key" ON "tags" ("name");
CREATE UNIQUE INDEX "tags_pkey" ON "tags" ("id");
CREATE UNIQUE INDEX "tags_slug_key" ON "tags" ("slug");
CREATE INDEX "transactions_course_id_index" ON "transactions" ("course_id");
CREATE INDEX "transactions_created_at_index" ON "transactions" ("created_at");
CREATE INDEX "transactions_order_id_index" ON "transactions" ("order_id");
CREATE UNIQUE INDEX "transactions_pkey" ON "transactions" ("id");
CREATE INDEX "transactions_status_index" ON "transactions" ("status");
CREATE INDEX "transactions_user_id_index" ON "transactions" ("user_id");
CREATE UNIQUE INDEX "unique_user_permission" ON "user_permissions" ("user_id","permission_id");
CREATE UNIQUE INDEX "user_permissions_pkey" ON "user_permissions" ("id");
CREATE UNIQUE INDEX "user_personalisations_pkey" ON "user_personalisations" ("id");
CREATE UNIQUE INDEX "user_personalisations_user_id_unique" ON "user_personalisations" ("user_id");
CREATE UNIQUE INDEX "user_settings_pkey" ON "user_settings" ("id");
CREATE UNIQUE INDEX "user_settings_user_id_unique" ON "user_settings" ("user_id");
CREATE UNIQUE INDEX "user_storage_pkey" ON "user_storage" ("user_id");
CREATE INDEX "user_storage_user_id_index" ON "user_storage" ("user_id");
CREATE UNIQUE INDEX "user_subscriptions_pkey" ON "user_subscriptions" ("id");
CREATE INDEX "user_subscriptions_status_expires_at_index" ON "user_subscriptions" ("status","expires_at");
CREATE INDEX "user_subscriptions_tier_id_index" ON "user_subscriptions" ("tier_id");
CREATE INDEX "user_subscriptions_user_id_status_index" ON "user_subscriptions" ("user_id","status");
CREATE UNIQUE INDEX "user_subscriptions_user_id_tier_id_status_unique" ON "user_subscriptions" ("user_id","tier_id","status");
CREATE INDEX "user_wishlist_created_at_index" ON "user_wishlist" ("created_at");
CREATE UNIQUE INDEX "user_wishlist_pkey" ON "user_wishlist" ("id");
CREATE INDEX "user_wishlist_user_id_index" ON "user_wishlist" ("user_id");
CREATE INDEX "user_wishlist_user_id_item_type_index" ON "user_wishlist" ("user_id","item_type");
CREATE UNIQUE INDEX "user_wishlist_user_id_item_type_item_id_unique" ON "user_wishlist" ("user_id","item_type","item_id");
CREATE INDEX "user_xp_current_level_index" ON "user_xp" ("current_level");
CREATE UNIQUE INDEX "user_xp_pkey" ON "user_xp" ("id");
CREATE INDEX "user_xp_total_xp_index" ON "user_xp" ("total_xp");
CREATE INDEX "user_xp_user_id_index" ON "user_xp" ("user_id");
CREATE UNIQUE INDEX "user_xp_user_id_unique" ON "user_xp" ("user_id");
CREATE INDEX "idx_users_email" ON "users" ("email");
CREATE INDEX "idx_users_is_active" ON "users" ("is_active");
CREATE INDEX "idx_users_role_id" ON "users" ("role_id");
CREATE INDEX "idx_users_username" ON "users" ("username");
CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");
CREATE UNIQUE INDEX "users_google_id_unique" ON "users" ("google_id");
CREATE INDEX "users_parent_id_index" ON "users" ("parent_id");
CREATE UNIQUE INDEX "users_pkey" ON "users" ("id");
CREATE UNIQUE INDEX "users_username_key" ON "users" ("username");
CREATE UNIQUE INDEX "users_permissions_pkey" ON "users_permissions" ("id");
CREATE UNIQUE INDEX "users_permissions_user_id_permission_id_unique" ON "users_permissions" ("user_id","permission_id");
CREATE UNIQUE INDEX "work_profiles_pkey" ON "work_profiles" ("id");
CREATE INDEX "work_profiles_user_id_index" ON "work_profiles" ("user_id");
CREATE UNIQUE INDEX "work_profiles_user_id_unique" ON "work_profiles" ("user_id");
CREATE UNIQUE INDEX "xp_activities_activity_type_unique" ON "xp_activities" ("activity_type");
CREATE UNIQUE INDEX "xp_activities_pkey" ON "xp_activities" ("id");
CREATE INDEX "xp_levels_is_active_index" ON "xp_levels" ("is_active");
CREATE INDEX "xp_levels_level_number_index" ON "xp_levels" ("level_number");
CREATE INDEX "xp_levels_min_xp_index" ON "xp_levels" ("min_xp");
CREATE UNIQUE INDEX "xp_levels_pkey" ON "xp_levels" ("id");
CREATE INDEX "xp_transactions_activity_type_index" ON "xp_transactions" ("activity_type");
CREATE INDEX "xp_transactions_created_at_index" ON "xp_transactions" ("created_at");
CREATE UNIQUE INDEX "xp_transactions_pkey" ON "xp_transactions" ("id");
CREATE INDEX "xp_transactions_reference_id_reference_type_index" ON "xp_transactions" ("reference_id","reference_type");
CREATE INDEX "xp_transactions_user_id_index" ON "xp_transactions" ("user_id");