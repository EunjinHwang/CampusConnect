
-- CampusConnect - Sprint 3
-- Subtask: Add attendance check-in controls
-- Author: Omar
--
-- Allows event owners and admins to check in registered attendees.
-- Only the attended column is updated.
-- Existing registration and cancellation functions remain unchanged.

CREATE OR REPLACE FUNCTION public.set_registration_attendance(
    p_registration_id uuid,
    p_attended boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_event_id uuid;
    v_status text;
BEGIN
    -- Step 1: Require a logged-in user.
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'You must be logged in.';
    END IF;

    -- Step 2: Find the registration and lock it during the update.
    SELECT event_id, status
    INTO v_event_id, v_status
    FROM public.registrations
    WHERE id = p_registration_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration not found.';
    END IF;

    -- Step 3: Only the event owner or admin may check in attendees.
    IF NOT (
        public.owns_event(v_event_id)
        OR public.is_admin()
    ) THEN
        RAISE EXCEPTION 'You do not have permission to manage attendance.';
    END IF;

    -- Step 4: Only confirmed registrations can be checked in.
    IF v_status <> 'confirmed' THEN
        RAISE EXCEPTION 'Only confirmed registrations can be checked in.';
    END IF;

    -- Step 5: Update attendance without changing other fields.
    UPDATE public.registrations
    SET attended = p_attended
    WHERE id = p_registration_id;

    RETURN true;
END;
$$;

-- Step 6: Restrict who can call this function.
REVOKE ALL ON FUNCTION public.set_registration_attendance(uuid, boolean)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.set_registration_attendance(uuid, boolean)
TO authenticated;
