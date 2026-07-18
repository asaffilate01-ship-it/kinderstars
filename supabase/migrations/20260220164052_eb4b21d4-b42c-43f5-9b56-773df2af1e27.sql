
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  -- Auto-assign role from metadata
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role);
    
    UPDATE public.profiles SET role = (NEW.raw_user_meta_data->>'role')::app_role WHERE user_id = NEW.id;
  END IF;

  -- Auto-create childminder_profiles for childminder role
  IF NEW.raw_user_meta_data->>'role' = 'childminder' THEN
    INSERT INTO public.childminder_profiles (user_id) VALUES (NEW.id);
  END IF;

  -- Auto-create parent_profiles for parent role
  IF NEW.raw_user_meta_data->>'role' = 'parent' THEN
    INSERT INTO public.parent_profiles (user_id) VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$;
