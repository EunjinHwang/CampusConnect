import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { fallbackImageFor } from "../lib/eventImages";

const CATEGORIES = ["All", "Academic", "Clubs", "Sports", "Culture", "Career"];

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

export default function Events() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [dateFilter, setDateFilter] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      if (!isSupabaseConfigured) {
        setEvents([]);
        setError(
          "Connect Supabase by adding VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your .env.local file.",
        );
        setLoading(false);
        return;
      }

      // 1. Construc the base query with ordering by starts_at
      let query = supabase
        .from("events")
        .select("*")
        // Only published, upcoming events (organizers can otherwise see their own drafts).
        .eq("status", "published")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at");

      // 2. Category Filter
      if (category !== "All") {
        query = query.eq("category", category);
      }

      // // 3. Date Filter
      // const now = new Date();
      // if (dateFilter === "upcoming") {
      //   query = query.gte("starts_at", now.toISOString());
      // } else if (dateFilter === "week") {
      //   const weekFromNow = new Date(now);
      //   weekFromNow.setDate(weekFromNow.getDate() + 7);
      //   query = query
      //     .gte("starts_at", now.toISOString())
      //     .lte("starts_at", weekFromNow.toISOString());
      // } else if (dateFilter === "weekend") {
      //   const weekendStart = new Date(now);
      //   weekendStart.setDate(
      //     weekendStart.getDate() +
      //       (now.getDay() === 0 ? -1 : (6 - now.getDay() + 7) % 7)
      //   );
      //   weekendStart.setHours(0, 0, 0, 0);

      //   const weekendEnd = new Date(weekendStart);
      //   weekendEnd.setDate(weekendEnd.getDate() + 2);

      //   query = query
      //     .gte("starts_at", weekendStart.toISOString())
      //     .lt("starts_at", weekendEnd.toISOString());
      // }

      // 4. Text Search Filter (using ILIKE in Supabase)
      const normalizedSearch = search.trim();
      if (normalizedSearch) {
        // Search for partial matches in the title or description
        query = query.or(
          `title.ilike.%${normalizedSearch}%,description.ilike.%${normalizedSearch}%,location.ilike.%${normalizedSearch}%`
        );
      }

      query = query.limit(100);

      try {
        const { data, error: loadError } = await query;
        if (!active) return;
        if (loadError) {
          setError(loadError.message);
          setEvents([]);
        } else {
          setEvents(data ?? []);
        }
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load events. Check your connection and try again.",
        );
        setEvents([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [category, dateFilter, search, reloadKey]);

  const normalizedSearch = search.trim().toLowerCase();
  const now = new Date();
  const weekFromNow = new Date(now);
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekendStart = new Date(now);
  weekendStart.setDate(
    weekendStart.getDate() +
      (now.getDay() === 0 ? -1 : (6 - now.getDay() + 7) % 7),
  );
  weekendStart.setHours(0, 0, 0, 0);
  const weekendEnd = new Date(weekendStart);
  weekendEnd.setDate(weekendEnd.getDate() + 2);
  const visibleEvents = events.filter((event) => {
    const matchesSearch =
      !normalizedSearch ||
      [event.title, event.description, event.location, event.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch));
    if (!matchesSearch) return false;

    const date = new Date(event.starts_at);
    if (dateFilter === "week") return date <= weekFromNow;
    if (dateFilter === "weekend") return date >= weekendStart && date < weekendEnd;
    return true;
  });

  return (
    <div className="pb-12">
      <section className="border-b border-[#10201A]/15 pb-8 pt-3 sm:pb-10">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F2542D]">
          Campus calendar
        </p>
        <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-[#10201A] sm:text-5xl">
              Find your next campus moment.
            </h1>
            <p className="mt-3 max-w-xl text-base text-[#3B4A43] sm:text-lg">
              Meet people, learn something new, and see what your campus is up to.
            </p>
          </div>
          <p className="shrink-0 text-sm font-medium text-[#3B4A43]">
            {loading ? "Finding events..." : `${visibleEvents.length} upcoming ${visibleEvents.length === 1 ? "event" : "events"}`}
          </p>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[#10201A]/20 bg-white px-4 focus-within:border-[#0E3B2E] focus-within:ring-2 focus-within:ring-[#0E3B2E]/15">
            <span aria-hidden="true" className="text-xl text-[#0E3B2E]">⌕</span>
            <span className="sr-only">Search events</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by event, place, or topic"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#10201A] outline-none placeholder:text-[#68736D]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-sm font-semibold text-[#0E3B2E] hover:text-[#F2542D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E3B2E]"
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[#10201A]/20 bg-white px-4">
            <span className="text-xs font-bold uppercase tracking-wide text-[#68736D]">When</span>
            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#10201A] outline-none"
              aria-label="Filter events by date"
            >
              <option value="upcoming">Any upcoming date</option>
              <option value="week">Next 7 days</option>
              <option value="weekend">This weekend</option>
            </select>
          </label>
        </div>
      </section>

      <nav className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-2" aria-label="Filter by category">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            aria-pressed={category === item}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E3B2E] ${
              category === item
                ? "border-[#0E3B2E] bg-[#0E3B2E] text-[#FAF9F5]"
                : "border-[#10201A]/20 bg-transparent text-[#3B4A43] hover:border-[#0E3B2E] hover:bg-white"
            }`}
          >
            {item === "All" ? "All events" : item}
          </button>
        ))}
      </nav>

      <section className="mt-5" aria-live="polite">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#10201A]">Coming up</h2>
            <p className="mt-1 text-sm text-[#68736D]">Good things happen when you show up.</p>
          </div>
          {!loading && !error && visibleEvents.length > 0 && (
            <span className="text-sm text-[#68736D]">Sorted by date</span>
          )}
        </div>

        {error ? (
          <div className="border-y border-[#F2542D]/40 py-8" role="alert">
            <h3 className="font-bold text-[#10201A]">Events could not be loaded</h3>
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
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading events">
            {[0, 1, 2].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="aspect-[4/3] rounded-lg bg-[#CDEBD8]" />
                <div className="mt-4 h-3 w-24 rounded bg-[#CDEBD8]" />
                <div className="mt-3 h-5 w-4/5 rounded bg-[#CDEBD8]" />
                <div className="mt-2 h-3 w-2/3 rounded bg-[#CDEBD8]" />
              </div>
            ))}
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="border-y border-[#10201A]/15 py-12 text-center">
            <p className="text-3xl" aria-hidden="true">✳</p>
            <h3 className="mt-3 text-xl font-bold text-[#10201A]">
              {events.length === 0 ? "Your next favorite event is still being planned." : "No events found for these filters."}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68736D]">
              {events.length === 0
                ? "Check back soon for campus events, workshops, and club meetups."
                : "Try another search, category, or date to see what is happening."}
            </p>
            {(search || category !== "All" || dateFilter !== "upcoming") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                  setDateFilter("upcoming");
                }}
                className="mt-5 font-semibold text-[#0E3B2E] underline decoration-[#FFC93C] decoration-2 underline-offset-4 hover:text-[#F2542D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E3B2E]"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <ul className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {visibleEvents.map((event) => {
              const date = formatEventDate(event.starts_at);
              const fallbackImage = fallbackImageFor(event.category);

              return (
                <li key={event.id} className="min-w-0">
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
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
