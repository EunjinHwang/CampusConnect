import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { fallbackImageFor } from "../lib/eventImages";

function formatEventDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { month: "TBA", day: "--", full: "Date to be announced" };

  return {
    month: date.toLocaleDateString("en-US", { month: "short" }),
    day: date.toLocaleDateString("en-US", { day: "2-digit" }),
    full: date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

function formatPrice(price) {
  const value = Number(price);
  return value === 0 ? "Free" : `$${value.toFixed(2)}`;
}

export default function MyEvents() {
  const { user } = useAuth();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }

  // Load the signed-in user's active registrations with their event and ticket tier.
  useEffect(() => {
    if (!user) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      const { data, error: loadError } = await supabase
        .from("registrations")
        .select("id, status, event_id, tier_id, events(*), ticket_tiers(name, price)")
        .eq("user_id", user.id)
        .neq("status", "cancelled");

      if (!active) return;
      if (loadError) {
        setError(loadError.message);
        setRegistrations([]);
      } else {
        // Drop rows whose event is hidden or deleted, then sort soonest first.
        const rows = (data ?? [])
          .filter((row) => row.events)
          .sort((a, b) => new Date(a.events.starts_at) - new Date(b.events.starts_at));
        setRegistrations(rows);
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [user, reloadKey]);

  const handleCancel = useCallback(async (registration) => {
    if (cancellingId) return;
    const confirmed = window.confirm(
      `Cancel your registration for "${registration.events.title}"?`,
    );
    if (!confirmed) return;

    setCancellingId(registration.id);
    setMessage(null);
    const { error: cancelError } = await supabase.rpc("cancel_registration", {
      p_registration_id: registration.id,
    });
    setCancellingId(null);

    if (cancelError) {
      setMessage({ type: "error", text: cancelError.message });
      return;
    }
    setRegistrations((current) => current.filter((row) => row.id !== registration.id));
    setMessage({ type: "success", text: "Your event registration has been cancelled." });
  }, [cancellingId]);

  const now = new Date();
  const isPastEvent = (event) => new Date(event.ends_at ?? event.starts_at) < now;
  const upcoming = registrations.filter((row) => !isPastEvent(row.events));
  // Most recent first for past events.
  const past = registrations.filter((row) => isPastEvent(row.events)).reverse();

  function renderCard(registration, { canCancel }) {
    const event = registration.events;
    const tier = registration.ticket_tiers;
    const date = formatEventDate(event.starts_at);
    const fallbackImage = fallbackImageFor(event.category);
    const isCancelled = event.status === "cancelled";

    return (
      <li key={registration.id} className="min-w-0">
        <Link
          to={`/events/${event.id}`}
          className="group block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0E3B2E]"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#CDEBD8]">
            <img
              src={event.image_url || fallbackImage}
              alt={event.title ? `Cover for ${event.title}` : "Campus event"}
              loading="lazy"
              onError={(imageEvent) => {
                // Swap once; if the fallback fails too, stop retrying.
                if (imageEvent.currentTarget.dataset.fallback) return;
                imageEvent.currentTarget.dataset.fallback = "1";
                imageEvent.currentTarget.src = fallbackImage;
              }}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
            />
            {event.category && (
              <span className="absolute left-3 top-3 rounded-sm bg-[#FAF9F5] px-2.5 py-1 text-xs font-bold text-[#10201A]">
                {event.category}
              </span>
            )}
            {isCancelled && (
              <span className="absolute right-3 top-3 rounded-sm bg-[#F2542D] px-2.5 py-1 text-xs font-bold text-white">
                Event cancelled
              </span>
            )}
          </div>
          <div className="flex gap-3 pt-3">
            <div className="w-11 shrink-0 pt-0.5 text-center">
              <span className="block text-[11px] font-bold uppercase tracking-wide text-[#F2542D]">
                {date.month}
              </span>
              <span className="block text-xl font-extrabold leading-tight text-[#10201A]">
                {date.day}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-lg font-bold leading-snug text-[#10201A] group-hover:text-[#0E3B2E]">
                {event.title}
              </h3>
              <p className="mt-1 text-sm text-[#3B4A43]">{date.full}</p>
              <p className="mt-1 truncate text-sm text-[#68736D]">
                {event.location || "Campus location to be announced"}
              </p>
              {tier && (
                <p className="mt-1 text-sm font-semibold text-[#0E3B2E]">
                  {tier.name} · {formatPrice(tier.price)}
                </p>
              )}
            </div>
          </div>
        </Link>

        {canCancel && !isCancelled && (
          <button
            type="button"
            onClick={() => handleCancel(registration)}
            disabled={cancellingId === registration.id}
            className="mt-3 rounded-lg border border-[#10201A]/20 px-4 py-2 text-sm font-semibold text-[#3B4A43] hover:border-[#F2542D] hover:text-[#9A2E12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E3B2E] disabled:opacity-50"
          >
            {cancellingId === registration.id ? "Cancelling..." : "Cancel registration"}
          </button>
        )}
      </li>
    );
  }

  return (
    <div className="pb-12">
      <section className="border-b border-[#10201A]/15 pb-8 pt-3 sm:pb-10">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F2542D]">
          Your registrations
        </p>
        <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-[#10201A] sm:text-5xl">
              My events
            </h1>
            <p className="mt-3 max-w-xl text-base text-[#3B4A43] sm:text-lg">
              Everything you've signed up for, in one place.
            </p>
          </div>
          <p className="shrink-0 text-sm font-medium text-[#3B4A43]">
            {loading
              ? "Loading your events..."
              : `${upcoming.length} upcoming ${upcoming.length === 1 ? "event" : "events"}`}
          </p>
        </div>
      </section>

      {message && (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={`mt-5 rounded-lg px-4 py-3 text-sm ${
            message.type === "error"
              ? "bg-[#F2542D]/10 text-[#9A2E12]"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {message.text}
        </p>
      )}

      {error ? (
        <div className="mt-6 border-y border-[#F2542D]/40 py-8" role="alert">
          <h3 className="font-bold text-[#10201A]">Your events could not be loaded</h3>
          <p className="mt-1 text-sm text-[#68736D]">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-4 rounded-full bg-[#0E3B2E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#10201A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E3B2E]"
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div
          className="mt-6 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Loading your events"
        >
          {[0, 1, 2].map((item) => (
            <div key={item} className="animate-pulse">
              <div className="aspect-[4/3] rounded-lg bg-[#CDEBD8]" />
              <div className="mt-4 h-3 w-24 rounded bg-[#CDEBD8]" />
              <div className="mt-3 h-5 w-4/5 rounded bg-[#CDEBD8]" />
              <div className="mt-2 h-3 w-2/3 rounded bg-[#CDEBD8]" />
            </div>
          ))}
        </div>
      ) : registrations.length === 0 ? (
        <div className="mt-6 border-y border-[#10201A]/15 py-12 text-center">
          <p className="text-3xl" aria-hidden="true">✳</p>
          <h3 className="mt-3 text-xl font-bold text-[#10201A]">
            You haven't registered for any events yet.
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68736D]">
            Browse what's coming up on campus and sign up for something that interests you.
          </p>
          <Link
            to="/events"
            className="mt-5 inline-block rounded-full bg-[#0E3B2E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#10201A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E3B2E]"
          >
            Browse events
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-8" aria-label="Upcoming events">
            <h2 className="mb-4 text-2xl font-extrabold text-[#10201A]">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-[#68736D]">
                Nothing coming up.{" "}
                <Link
                  to="/events"
                  className="font-semibold text-[#0E3B2E] underline decoration-[#FFC93C] decoration-2 underline-offset-4 hover:text-[#F2542D]"
                >
                  Find an event
                </Link>
              </p>
            ) : (
              <ul className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((row) => renderCard(row, { canCancel: true }))}
              </ul>
            )}
          </section>

          {past.length > 0 && (
            <section className="mt-12" aria-label="Past events">
              <h2 className="mb-4 text-2xl font-extrabold text-[#10201A]">Past</h2>
              <ul className="grid gap-x-5 gap-y-9 opacity-80 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((row) => renderCard(row, { canCancel: false }))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}