
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

// Sprint 3: Organizer attendance check-in page
export default function Attendance() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Load the selected event and its registrations.
  async function loadAttendance() {
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Please log in.");
      }

      const { data: eventData, error: eventError } =
        await supabase
          .from("events")
          .select("id, title, organizer_id")
          .eq("id", id)
          .single();

      if (eventError) throw eventError;

      // Client-side check; Supabase must also enforce access.
      if (eventData.organizer_id !== authData.user.id) {
        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("role")
            .eq("id", authData.user.id)
            .single();

        if (profileError) throw profileError;

        if (profile.role !== "admin") {
          throw new Error("You cannot manage this event.");
        }
      }

      const { data, error: registrationError } =
        await supabase
          .from("registrations")
          .select("id, user_id, status, attended, created_at")
          .eq("event_id", id)
          .order("created_at", { ascending: false });

      if (registrationError) throw registrationError;

      setEvent(eventData);
      setRegistrations(data || []);
    } catch (err) {
      setEvent(null);
      setRegistrations([]);
      setError(err.message || "Could not load attendance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, [id]);

  // Calls the secure Supabase function.
  async function updateAttendance(registration) {
    if (busyId) return;

    setBusyId(registration.id);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase.rpc(
      "set_registration_attendance",
      {
        p_registration_id: registration.id,
        p_attended: !registration.attended,
      }
    );

    if (updateError) {
      setError(updateError.message);
    } else {
      setRegistrations((previous) =>
        previous.map((item) =>
          item.id === registration.id
            ? { ...item, attended: !item.attended }
            : item
        )
      );
      setMessage("Attendance updated successfully.");
    }

    setBusyId(null);
  }

  const confirmed = registrations.filter(
    (item) => item.status === "confirmed"
  );

  const attended = confirmed.filter(
    (item) => item.attended
  ).length;

  if (loading) {
    return <p className="py-10">Loading attendance...</p>;
  }

  return (
    <div className="space-y-6 pb-10">
      <Link to="/events" className="text-[#0E3B2E] underline">
        ← Back to Events
      </Link>

      <div className="rounded-3xl bg-[#0E3B2E] p-8 text-white">
        <h1 className="text-3xl font-bold">
          Attendance Check-In
        </h1>
        <p className="mt-2">{event?.title || "Event"}</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="rounded-lg bg-green-50 p-4 text-green-800">
          {message}
        </p>
      )}

      {event && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Confirmed", confirmed.length],
              ["Checked In", attended],
              ["Not Checked In", confirmed.length - attended],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border bg-white p-5">
                <p className="text-sm text-slate-600">{label}</p>
                <p className="mt-2 text-3xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-4">Registration</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Attendance</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration) => (
                  <tr key={registration.id} className="border-t">
                    <td className="p-4 font-medium">
                      {registration.id.slice(0, 8)}...
                    </td>
                    <td className="p-4">{registration.status}</td>
                    <td className="p-4">
                      {registration.attended
                        ? "Checked In"
                        : "Not Checked In"}
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        disabled={
                          registration.status !== "confirmed" ||
                          busyId !== null
                        }
                        onClick={() => updateAttendance(registration)}
                        className="rounded-lg bg-[#0E3B2E] px-4 py-2 font-semibold text-white disabled:opacity-40"
                      >
                        {busyId === registration.id
                          ? "Saving..."
                          : registration.attended
                            ? "Undo Check-In"
                            : "Check In"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {registrations.length === 0 && (
              <p className="p-6 text-slate-500">
                No registrations found.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
