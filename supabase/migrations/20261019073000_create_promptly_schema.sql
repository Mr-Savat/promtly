/*
# Promptly — core schema

## Overview
Creates the data model for the Promptly AI Prompt Assistant: prompts the user
writes, analyses of what's missing/problematic, and the follow-up questions the
assistant asks. All tables are owner-scoped to the authenticated user via RLS.

## New Tables
1. `prompts`
   - id (uuid pk)
   - user_id (uuid, defaults to auth.uid(), fk auth.users, cascade)
   - original_text (text, the user's raw request)
   - improved_text (text, the final improved prompt, nullable until generated)
   - status (text: draft | analyzing | needs_info | ready | error)
   - quality_score (int 0-100, nullable — assistant signal, not objective metric)
   - created_at, updated_at (timestamptz)
2. `prompt_analyses`
   - id (uuid pk)
   - prompt_id (uuid fk prompts, cascade)
   - category (text: goal, context, target_user, task, input, expected_output,
     constraints, examples, technical, ambiguity)
   - severity (text: good | needs_attention | missing)
   - explanation (text, human-readable reasoning)
   - suggestion (text, optional fix)
3. `prompt_questions`
   - id (uuid pk)
   - prompt_id (uuid fk prompts, cascade)
   - question (text, the follow-up question)
   - answer (text, nullable until answered)
   - created_at, answered_at (timestamptz)

## Security
- RLS enabled on all tables.
- Owner-scoped CRUD via auth.uid() = user_id on prompts.
- Child tables (analyses, questions) scoped through EXISTS parent ownership
  check for SELECT/INSERT/UPDATE/DELETE.
- Owner columns default to auth.uid() so inserts that omit user_id succeed.
*/

CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text text NOT NULL,
  improved_text text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','analyzing','needs_info','ready','error')),
  quality_score int CHECK (quality_score >= 0 AND quality_score <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_prompts" ON prompts;
CREATE POLICY "select_own_prompts" ON prompts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_prompts" ON prompts;
CREATE POLICY "insert_own_prompts" ON prompts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_prompts" ON prompts;
CREATE POLICY "update_own_prompts" ON prompts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_prompts" ON prompts;
CREATE POLICY "delete_own_prompts" ON prompts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS prompts_user_id_created_idx ON prompts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS prompt_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('goal','context','target_user','task','input','expected_output','constraints','examples','technical','ambiguity')),
  severity text NOT NULL CHECK (severity IN ('good','needs_attention','missing')),
  explanation text NOT NULL,
  suggestion text
);

ALTER TABLE prompt_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_analyses" ON prompt_analyses;
CREATE POLICY "select_own_analyses" ON prompt_analyses FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM prompts p WHERE p.id = prompt_analyses.prompt_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_analyses" ON prompt_analyses;
CREATE POLICY "insert_own_analyses" ON prompt_analyses FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM prompts p WHERE p.id = prompt_analyses.prompt_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_analyses" ON prompt_analyses;
CREATE POLICY "update_own_analyses" ON prompt_analyses FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM prompts p WHERE p.id = prompt_analyses.prompt_id AND p.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM prompts p WHERE p.id = prompt_analyses.prompt_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_analyses" ON prompt_analyses;
CREATE POLICY "delete_own_analyses" ON prompt_analyses FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM prompts p WHERE p.id = prompt_analyses.prompt_id AND p.user_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS prompt_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz
);

ALTER TABLE prompt_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_questions" ON prompt_questions;
CREATE POLICY "select_own_questions" ON prompt_questions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM prompts p WHERE p.id = prompt_questions.prompt_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_questions" ON prompt_questions;
CREATE POLICY "insert_own_questions" ON prompt_questions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM prompts p WHERE p.id = prompt_questions.prompt_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_questions" ON prompt_questions;
CREATE POLICY "update_own_questions" ON prompt_questions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM prompts p WHERE p.id = prompt_questions.prompt_id AND p.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM prompts p WHERE p.id = prompt_questions.prompt_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_questions" ON prompt_questions;
CREATE POLICY "delete_own_questions" ON prompt_questions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM prompts p WHERE p.id = prompt_questions.prompt_id AND p.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS prompt_analyses_prompt_idx ON prompt_analyses(prompt_id);
CREATE INDEX IF NOT EXISTS prompt_questions_prompt_idx ON prompt_questions(prompt_id);