import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { fallbackImageFor } from "../lib/eventImages";

function formatDateRange(startsAt, endsAt) {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return "Date to be announced";
  const startText = start.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  if (!endsAt) return startText;
  const end = new Date(endsAt);
  const sameDay = start.toDateString() === end.toDateString();
  const endText = end.toLocaleString(
    "en-US",
    sameDay
      ? { hour: "numeric", minute: "2-digit" }
      : { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
  );
  return `${startText} – ${endText}`;
}

function formatPrice(price) {
  const value = Number(price);
  return value === 0 ? "Free" : `$${value.toFixed(2)}`;
}

export default function EventDetails() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [tiers, setTiers] = useState([]);
  // The signed-in user's active registration for this event, if any.
  const [registration, setRegistration] = useState(null);
  const [selectedTierId, setSelectedTierId] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }

  // Event, its organizer and its tiers. RLS hides drafts from other people.
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError("");
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!active) return;
      if (eventError) {
        setLoadError(eventError.message);
        setLoading(false);
        return;
      }
      setEvent(eventData);
      if (!eventData) {
        setLoading(false);
        return;
      }

      const [{ data: tierData, error: tierError }, { data: orgData }] = await Promise.all([
        supabase
          .from("ticket_tiers")
          .select("*")
          .eq("event_id", id)
          .eq("is_active", true)
          .order("sort_order")
          .order("price"),
        supabase
          .from("organizer_profiles")
          .select("display_name")
          .eq("profile_id", eventData.organizer_id)
          .maybeSingle(),
      ]);
      if (!active) return;
      if (tierError) setLoadError(tierError.message);
      setTiers(tierData ?? []);
      setOrganizer(orgData);
      setSelectedTierId(tierData?.[0]?.id ?? "");
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [id]);

  // Is the signed-in user already registered? RLS only returns their own rows.
  useEffect(() => {
    setRegistration(null);
    if (!user) return;
    let active = true;
    supabase
      .from("registrations")
      .select("id, tier_id")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .neq("status", "cancelled")
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error("Could not load registration:", error.message);
        setRegistration(data ?? null);
      });
    return () => {
      active = false;
    };
  }, [id, user]);

  // Any tier, free or paid. Paid tiers don't charge anything until payments exist.
  async function handleRegister() {
    if (!selectedTierId || busy) return;
    setBusy(true);
    setMessage(null);
    const { data, error } = await supabase.rpc("register_for_tier", {
      p_tier_id: selectedTierId,
    });
    setBusy(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setRegistration({ id: data, tier_id: selectedTierId });
    setMessage({ type: "success", text: "You're registered. See you there!" });
  }

  async function handleCancel() {
    if (!registration || busy) return;
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.rpc("cancel_registration", {
      p_registration_id: registration.id,
    });
    setBusy(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setRegistration(null);
    setMessage({ type: "success", text: "Your event registration has been cancelled." });
  }

  if (loading) {
    return <p className="py-12 text-slate-500">Loading event...</p>;
  }

  if (loadError && !event) {
    return (
      <div className="py-12">
        <BackLink />
        <p className="mt-6 text-red-600">Could not load this event: {loadError}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-12">
        <BackLink />
        <h1 className="mt-6 text-2xl font-bold text-[#10201A]">Event not found</h1>
        <p className="mt-2 text-slate-600">It may have been removed or isn't published yet.</p>
      </div>
    );
  }

  const fallbackImage = fallbackImageFor(event.category);
  const isPast = new Date(event.ends_at ?? event.starts_at) < new Date();
  const isCancelled = event.status === "cancelled";
  const registeredTier = tiers.find((t) => t.id === registration?.tier_id);
  const selectedTier = tiers.find((t) => t.id === selectedTierId);

  return (
    <div className="pb-12">
      <BackLink />

      <article className="mt-5 grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:grid-cols-[1fr_minmax(0,22rem)]">
        <div className="order-2 p-6 sm:p-8 md:order-1">
          {event.category && (
            <p className="text-sm font-semibold text-[#0E3B2E]">{event.category}</p>
          )}
          <h1 className="mt-2 text-3xl font-extrabold leading-tight text-[#10201A]">
            {event.title}
          </h1>

          <div className="mt-4 space-y-2 text-[#3B4A43]">
            <p>📅 {formatDateRange(event.starts_at, event.ends_at)}</p>
            {event.location && <p>📍 {event.location}</p>}
            {organizer?.display_name && <p>👥 Hosted by {organizer.display_name}</p>}
          </div>

          {event.description && (
            <>
              <h2 className="mt-6 text-lg font-bold text-[#10201A]">About this event</h2>
              <p className="mt-2 whitespace-pre-line text-[#3B4A43]">{event.description}</p>
            </>
          )}

          <section className="mt-8 border-t border-slate-200 pt-6" aria-label="Registration">
            {isCancelled ? (
              <p className="font-semibold text-[#F2542D]">This event has been cancelled.</p>
            ) : registration ? (
              <div>
                <p className="font-semibold text-[#0E3B2E]">You're registered for this event.</p>
                {registeredTier && (
                  <p className="mt-1 text-sm text-slate-600">
                    Ticket: {registeredTier.name} ({formatPrice(registeredTier.price)})
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={busy}
                  className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {busy ? "Cancelling..." : "Cancel registration"}
                </button>
              </div>
            ) : isPast ? (
              <p className="text-slate-600">This event has already happened.</p>
            ) : tiers.length === 0 ? (
              <p className="text-slate-600">Registration isn't open yet.</p>
            ) : (
              <div>
                <h2 className="text-lg font-bold text-[#10201A]">Choose your ticket</h2>
                <div className="mt-3 space-y-2" role="radiogroup" aria-label="Ticket tiers">
                  {tiers.map((tier) => {
                    const checked = tier.id === selectedTierId;
                    return (
                      <label
                        key={tier.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                          checked ? "border-[#0E3B2E] bg-[#0E3B2E]/5" : "border-slate-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="tier"
                          value={tier.id}
                          checked={checked}
                          onChange={() => setSelectedTierId(tier.id)}
                          className="mt-1 accent-[#0E3B2E]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="font-semibold text-[#10201A]">{tier.name}</span>
                            <span className="font-semibold text-[#10201A]">
                              {formatPrice(tier.price)}
                            </span>
                          </span>
                          {tier.description && (
                            <span className="mt-0.5 block text-sm text-slate-600">
                              {tier.description}
                            </span>
                          )}
                          {tier.capacity && (
                            <span className="mt-0.5 block text-xs text-slate-500">
                              Limited to {tier.capacity} people
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {Number(selectedTier?.price) > 0 && (
                  <p className="mt-5 text-sm text-slate-600">
                    Payments aren't set up yet, so you won't be charged for this ticket.
                  </p>
                )}
                {user ? (
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={!selectedTier || busy}
                    className="mt-5 block rounded-lg bg-[#0E3B2E] px-6 py-3 font-semibold text-white hover:bg-[#10201A] disabled:opacity-50"
                  >
                    {busy ? "Registering..." : "Register for Event"}
                  </button>
                ) : (
                  <Link
                    to="/login"
                    state={{ from: location }}
                    className="mt-5 inline-block rounded-lg bg-[#0E3B2E] px-6 py-3 font-semibold text-white hover:bg-[#10201A]"
                  >
                    Log in to register
                  </Link>
                )}
              </div>
            )}

            {message && (
              <p
                role={message.type === "error" ? "alert" : "status"}
                className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                  message.type === "error"
                    ? "bg-[#F2542D]/10 text-[#9A2E12]"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {message.text}
              </p>
            )}
          </section>
        </div>

        <div className="order-1 bg-[#CDEBD8] md:order-2">
          <img
            src={event.image_url || fallbackImage}
            alt={event.title ? `Cover for ${event.title}` : "Campus event"}
            onError={(e) => {
              // Swap once; if the fallback fails too, stop retrying.
              if (e.currentTarget.dataset.fallback) return;
              e.currentTarget.dataset.fallback = "1";
              e.currentTarget.src = fallbackImage;
            }}
            className="h-56 w-full object-cover md:h-full"
          />
        </div>
      </article>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/events" className="text-[#0E3B2E] hover:underline">
      ← Back to Events
    </Link>
  );
}
