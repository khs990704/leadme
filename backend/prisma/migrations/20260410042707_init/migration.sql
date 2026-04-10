-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "avatar_url" TEXT,
    "google_id" VARCHAR(255) NOT NULL,
    "refresh_token_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plans" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(30) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "params" JSONB,
    "generation_mode" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "macro_goals" (
    "id" TEXT NOT NULL,
    "plan_id" VARCHAR(30) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "macro_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "goal_id" VARCHAR(30) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "target_date" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todo_nodes" (
    "id" TEXT NOT NULL,
    "milestone_id" VARCHAR(30) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'todo',
    "order" INTEGER NOT NULL DEFAULT 0,
    "estimated_minutes" INTEGER,
    "generation_basis" VARCHAR(20),
    "study_guide" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "todo_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" TEXT NOT NULL,
    "node_id" VARCHAR(30) NOT NULL,
    "user_id" VARCHAR(30) NOT NULL,
    "timer_type" VARCHAR(20) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_logs" (
    "id" TEXT NOT NULL,
    "session_id" VARCHAR(30) NOT NULL,
    "progress_percent" INTEGER,
    "focus_level" INTEGER,
    "distraction_type" VARCHAR(20),
    "distraction_detail" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "node_id" VARCHAR(30) NOT NULL,
    "user_id" VARCHAR(30) NOT NULL,
    "reflection" TEXT,
    "difficulty" TEXT,
    "distraction" TEXT,
    "improvement" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "node_id" VARCHAR(30),
    "plan_id" VARCHAR(30),
    "user_id" VARCHAR(30) NOT NULL,
    "scope" VARCHAR(10) NOT NULL,
    "summary" TEXT NOT NULL,
    "progress_analysis" JSONB,
    "suggestions" JSONB,
    "motivation_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_checks" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(30) NOT NULL,
    "session_id" VARCHAR(30),
    "mental_ready" BOOLEAN NOT NULL DEFAULT false,
    "environment_ready" BOOLEAN NOT NULL DEFAULT false,
    "noise_blocked" BOOLEAN NOT NULL DEFAULT false,
    "no_distraction" BOOLEAN NOT NULL DEFAULT false,
    "no_conflict_schedule" BOOLEAN NOT NULL DEFAULT false,
    "warmup_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pre_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "idx_plans_user_status" ON "study_plans"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_goals_plan_order" ON "macro_goals"("plan_id", "order");

-- CreateIndex
CREATE INDEX "idx_milestones_goal_order" ON "milestones"("goal_id", "order");

-- CreateIndex
CREATE INDEX "idx_nodes_milestone_status" ON "todo_nodes"("milestone_id", "status");

-- CreateIndex
CREATE INDEX "idx_nodes_milestone_order" ON "todo_nodes"("milestone_id", "order");

-- CreateIndex
CREATE INDEX "idx_sessions_node" ON "study_sessions"("node_id");

-- CreateIndex
CREATE INDEX "idx_sessions_user_date" ON "study_sessions"("user_id", "start_time");

-- CreateIndex
CREATE INDEX "idx_sessions_node_status" ON "study_sessions"("node_id", "status");

-- CreateIndex
CREATE INDEX "idx_logs_session" ON "session_logs"("session_id");

-- CreateIndex
CREATE INDEX "idx_reviews_node" ON "reviews"("node_id");

-- CreateIndex
CREATE INDEX "idx_feedback_node" ON "feedback"("node_id");

-- CreateIndex
CREATE INDEX "idx_feedback_plan" ON "feedback"("plan_id");

-- CreateIndex
CREATE INDEX "idx_feedback_user" ON "feedback"("user_id");

-- CreateIndex
CREATE INDEX "idx_prechecks_user_date" ON "pre_checks"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "macro_goals" ADD CONSTRAINT "macro_goals_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "macro_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todo_nodes" ADD CONSTRAINT "todo_nodes_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "todo_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "todo_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "todo_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_checks" ADD CONSTRAINT "pre_checks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_checks" ADD CONSTRAINT "pre_checks_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
