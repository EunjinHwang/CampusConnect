import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

// Sprint 3: the events an organizer hosts, with links to each event's
// registration list. Admins see every event.

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OrganizerEvents() {
  const { user, role } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      // registrations(status) comes back filtered by RLS, which already
      // lets the owner and admins read them.
      let query = supabase
        .from("events")
        .select("id, title, starts_at, status, registrations(status, attended)")
        .order("starts_at", { ascending: false });

      if (role !== "admin") query = query.eq("organizer_id", user.id);

      const { data, error: loadError } = await query;
      if (!active) return;
      if (loadError) setError(loadError.message);
      setEvents(data || []);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [user, role]);

  if (loading) {
    return <p className="py-10 text-slate-500">Loading your events...</p>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#10201A]">
            {role === "admin" ? "All events" : "My hosted events"}
          </h1>
          <p className="mt-1 text-slate-600">
            Open an event to see who registered and check people in.
          </p>
        </div>
        <Link
          to="/organizer"
          className="rounded-lg bg-[#0E3B2E] px-4 py-2 font-semibold text-white hover:bg-[#10201A]"
        >
          Create event
        </Link>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      {events.length === 0 && !error ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
          You haven't created any events yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => {
            const confirmed = (event.registrations || []).filter(
              (r) => r.status === "confirmed"
            );
            const checkedIn = confirmed.filter((r) => r.attended).length;
            return (
              <li
                key={event.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#10201A]">{event.title}</p>
                  <p className="text-sm text-slate-600">
                    {formatDate(event.starts_at)}
                    {event.status !== "published" && (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize">
                        {event.status}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {confirmed.length} registered · {checkedIn} checked in
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    to={`/organizer/edit/${event.id}`}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/organizer/attendance/${event.id}`}
                    className="rounded-lg bg-[#0E3B2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#10201A]"
                  >
                    Registrations
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
