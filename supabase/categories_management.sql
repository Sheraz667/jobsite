-- Run schema.sql first on a new project. This migration adds the built-in job types to an existing project.
insert into public.categories (slug, name, description) values
  ('government', 'Government Jobs', 'Federal and provincial public sector roles'),
  ('private', 'Private Jobs', 'Corporate and private sector openings'),
  ('internship', 'Internships', 'Career-building internship programs'),
  ('apprenticeship', 'Apprenticeships', 'Skill-based apprenticeship tracks'),
  ('police', 'Police & Forces', 'Law enforcement and force recruitment'),
  ('banking', 'Banking Jobs', 'Banking and financial sector roles'),
  ('teaching', 'Teaching Jobs', 'Education and academic positions'),
  ('healthcare', 'Healthcare Jobs', 'Medical and clinical opportunities'),
  ('engineering', 'Engineering Jobs', 'Technical and engineering roles'),
  ('it', 'IT & Software', 'Technology and product roles'),
  ('other', 'Other', 'Miscellaneous career updates')
on conflict (slug) do nothing;