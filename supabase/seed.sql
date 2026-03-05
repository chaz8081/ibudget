-- Seed a test user via Supabase Auth
-- Email: test@ibudget.local / Password: password123
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone, phone_change, phone_change_token,
  reauthentication_token,
  is_super_admin, is_sso_user
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'authenticated', 'authenticated',
  'test@ibudget.local',
  crypt('password123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"display_name": "Test User"}'::jsonb,
  '', '',
  '', '', '',
  '', '', '',
  '',
  false, false
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  jsonb_build_object('sub', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'email', 'test@ibudget.local'),
  'email',
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  now(), now(), now()
);

-- The profile is auto-created by the trigger in migration 00001
-- But if running seed independently, ensure it exists:
INSERT INTO public.profiles (id, display_name, created_at, updated_at)
VALUES ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'Test User', now(), now())
ON CONFLICT (id) DO NOTHING;
