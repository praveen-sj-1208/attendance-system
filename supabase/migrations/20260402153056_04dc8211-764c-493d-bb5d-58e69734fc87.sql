-- Add unique constraints to prevent duplicate data
ALTER TABLE public.students
  ADD CONSTRAINT students_email_unique UNIQUE (email);

ALTER TABLE public.students
  ADD CONSTRAINT students_register_number_unique UNIQUE (register_number);

-- Add unique constraint for attendance (prevent same student, same date, same subject)
ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_student_date_subject_unique UNIQUE (student_id, date, subject);

-- Create a function to auto-generate notifications after attendance is marked
CREATE OR REPLACE FUNCTION public.generate_attendance_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_total INT;
  v_present INT;
  v_pct NUMERIC;
  v_msg TEXT;
  v_type TEXT;
BEGIN
  -- Get student info
  SELECT * INTO v_student FROM public.students WHERE id = NEW.student_id;
  IF v_student IS NULL OR v_student.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate attendance stats
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'present')
  INTO v_total, v_present
  FROM public.attendance
  WHERE student_id = NEW.student_id;

  v_pct := CASE WHEN v_total > 0 THEN ROUND((v_present::numeric / v_total) * 100, 1) ELSE 0 END;

  -- Generate appropriate message
  IF v_pct = 100 THEN
    v_msg := 'Excellent ' || v_student.full_name || '! You have maintained 100% attendance. Keep it up! 🌟';
    v_type := 'success';
  ELSIF v_pct < 70 THEN
    v_msg := 'Hi ' || v_student.full_name || ', your attendance is ' || v_pct || '%. Please improve to avoid issues. ⚠️';
    v_type := 'warning';
  ELSIF v_pct >= 70 AND v_pct < 85 THEN
    v_msg := 'Good progress ' || v_student.full_name || '! Your attendance is ' || v_pct || '%. Keep pushing higher! 📈';
    v_type := 'info';
  ELSE
    v_msg := 'Attendance recorded for ' || NEW.subject || ' on ' || NEW.date || '. Current: ' || v_pct || '%.';
    v_type := 'info';
  END IF;

  -- Insert notification
  INSERT INTO public.notifications (user_id, message, type)
  VALUES (v_student.user_id, v_msg, v_type);

  RETURN NEW;
END;
$$;

-- Create trigger for auto-notifications on attendance
CREATE TRIGGER on_attendance_marked
  AFTER INSERT OR UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.generate_attendance_notification();