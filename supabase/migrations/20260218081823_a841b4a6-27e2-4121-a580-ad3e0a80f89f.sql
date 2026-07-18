
-- Update password for trainee account using Supabase's crypt function
UPDATE auth.users 
SET encrypted_password = crypt('Trainee123!', gen_salt('bf'))
WHERE email = 'trainee@kinderstars.demo';
