-- Migration: Add 5 new sandbox-planner steps
-- Tables: idea_benchmarking, idea_prd, idea_database, idea_styles, idea_milestones_and_tasks

-- 1. Extend os_idea_block enum with 5 new values
ALTER TYPE public.os_idea_block ADD VALUE IF NOT EXISTS 'benchmarking';
ALTER TYPE public.os_idea_block ADD VALUE IF NOT EXISTS 'prd';
ALTER TYPE public.os_idea_block ADD VALUE IF NOT EXISTS 'database';
ALTER TYPE public.os_idea_block ADD VALUE IF NOT EXISTS 'visual_styles';
ALTER TYPE public.os_idea_block ADD VALUE IF NOT EXISTS 'milestones_and_tasks';

-- 2. idea_benchmarking: 3 sections (overview, comparison table, takeaways)
CREATE TABLE public.idea_benchmarking (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id     UUID NOT NULL REFERENCES public.idea(id) ON DELETE CASCADE,
  overview    TEXT,
  comparison  TEXT,
  takeaways   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(idea_id)
);
ALTER TABLE public.idea_benchmarking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idea_benchmarking_all" ON public.idea_benchmarking
  FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER set_updated_at_idea_benchmarking BEFORE UPDATE ON public.idea_benchmarking
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. idea_prd: 9 sections
CREATE TABLE public.idea_prd (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id                UUID NOT NULL REFERENCES public.idea(id) ON DELETE CASCADE,
  app_overview           TEXT,
  objectives             TEXT,
  priority_personas      TEXT,
  essential_features     TEXT,
  user_flow              TEXT,
  non_functional_reqs    TEXT,
  out_of_scope           TEXT,
  success_indicators     TEXT,
  phasing_notes          TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(idea_id)
);
ALTER TABLE public.idea_prd ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idea_prd_all" ON public.idea_prd
  FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER set_updated_at_idea_prd BEFORE UPDATE ON public.idea_prd
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. idea_database: 3 sections
CREATE TABLE public.idea_database (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id        UUID NOT NULL REFERENCES public.idea(id) ON DELETE CASCADE,
  tables_schema  TEXT,
  relationships  TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(idea_id)
);
ALTER TABLE public.idea_database ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idea_database_all" ON public.idea_database
  FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER set_updated_at_idea_database BEFORE UPDATE ON public.idea_database
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. idea_styles: 3 sections
CREATE TABLE public.idea_styles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id          UUID NOT NULL REFERENCES public.idea(id) ON DELETE CASCADE,
  logo_branding    TEXT,
  color_palette    TEXT,
  product_feeling  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(idea_id)
);
ALTER TABLE public.idea_styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idea_styles_all" ON public.idea_styles
  FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER set_updated_at_idea_styles BEFORE UPDATE ON public.idea_styles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. idea_milestones_and_tasks: 1 section
CREATE TABLE public.idea_milestones_and_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id     UUID NOT NULL REFERENCES public.idea(id) ON DELETE CASCADE,
  content     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(idea_id)
);
ALTER TABLE public.idea_milestones_and_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idea_milestones_all" ON public.idea_milestones_and_tasks
  FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER set_updated_at_idea_milestones BEFORE UPDATE ON public.idea_milestones_and_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Seed 5 prompt rows for the new steps
INSERT INTO public.prompt (type, name, description) VALUES
('benchmarking', 'Benchmarking Prompt', 'You are a competitive analysis expert. Given the following startup idea and its context, create a comprehensive benchmarking analysis.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
Product Overview: {{product_overview}}

Return a JSON object with exactly these keys:
- "overview": Rich HTML text providing an overview of the competitive landscape and methodology used for benchmarking.
- "comparison": Rich HTML text containing a detailed comparison table of competing apps/platforms. Use an HTML table with columns: Name, Platform(s), Core Functionality, Similarities to the Idea, Pricing / Free Tier, Link / Notes. Include at least 5-8 competitors.
- "takeaways": Rich HTML text summarizing key takeaways, differentiators, and strategic positioning insights.

All values must be valid HTML strings.
Return ONLY valid JSON.'),

('prd', 'PRD Prompt', 'You are a senior product manager. Given the following startup idea and its complete context, write a comprehensive Product Requirements Document (PRD).

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}
Product Overview: {{product_overview}}
Features: {{features}}
ICPs: {{icp_names}}

Return a JSON object with exactly these keys:
- "app_overview": Rich HTML text with the full app overview and vision.
- "objectives": Rich HTML text listing measurable objectives.
- "priority_personas": Rich HTML text describing priority personas (primary, secondary, end user).
- "essential_features": Rich HTML text with essential features organized by category with sub-items.
- "user_flow": Rich HTML text describing the primary user flows for each persona.
- "non_functional_reqs": Rich HTML text listing non-functional requirements (platform, security, scalability, etc.).
- "out_of_scope": Rich HTML text listing what is explicitly out of scope for v1.
- "success_indicators": Rich HTML text with measurable success indicators.
- "phasing_notes": Rich HTML text with phasing/roadmap notes for future development.

All values must be valid HTML strings.
Return ONLY valid JSON.'),

('database', 'Database Prompt', 'You are a database architect. Given the following startup idea, its PRD, and product definition, design a complete data model.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Product Overview: {{product_overview}}
Features: {{features}}
PRD Essential Features: {{essential_features}}

Return a JSON object with exactly these keys:
- "tables_schema": Rich HTML text defining all database tables. For each table, include field name, type, and description in HTML table format. Include primary keys, foreign keys, and constraints.
- "relationships": Rich HTML text describing all entity relationships (one-to-one, one-to-many, many-to-many), with clear descriptions of how tables connect.
- "notes": Rich HTML text with important architectural decisions, MVP simplifications, and migration notes.

All values must be valid HTML strings.
Return ONLY valid JSON.'),

('visual_styles', 'Visual Styles Prompt', 'You are a brand identity designer. Given the following startup idea and product context, create a comprehensive visual style guide.

Idea: {{idea_name}} — {{idea_description}}
Core Problem: {{core_problem}}
Target Audience: {{target_audience}}

Return a JSON object with exactly these keys:
- "logo_branding": Rich HTML text describing the conceptual logo, app name styling, typography direction, icon/symbol concepts, and overall brand style. Include specific font recommendations and design rationale.
- "color_palette": Rich HTML text defining the core color palette (5 colors minimum). For each color provide: name, hex code, and usage guidelines. Format as a clear list or table.
- "product_feeling": Rich HTML text describing the product feeling for different contexts (admin UI, user-facing, mobile, etc.) and how the visual identity creates the intended emotional response.

All values must be valid HTML strings.
Return ONLY valid JSON.'),

('milestones_and_tasks', 'Milestones & Tasks Prompt', 'You are a project planning expert. Given the following startup idea, its PRD, and database design, create a comprehensive project milestone and task breakdown.

Idea: {{idea_name}} — {{idea_description}}
PRD Overview: {{prd_overview}}
PRD Features: {{essential_features}}

Return a JSON object with exactly this key:
- "content": Rich HTML text containing the complete project milestones and tasks breakdown. Structure as:
  - Multiple milestones (Milestone 1, 2, 3, etc.), each with a Focus description and Total Estimated Time in hours.
  - For each milestone, include an HTML table with columns: Task Name, Estimated Time (h), Definition of Done.
  - Include QA and client request buffer tasks in each milestone.
  - End with exit criteria for each milestone.

The value must be a valid HTML string.
Return ONLY valid JSON.');
