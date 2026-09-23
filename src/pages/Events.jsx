import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const CATEGORIES = ["All", "Academic", "Clubs", "Sports", "Culture", "Career"];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let q = supabase
        .from("events")
        .select("*")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at");
      if (search.trim()) q = q.ilike("title", `%${search.trim()}%`);
      if (category !== "All") q = q.eq("category", category);
      const { data, error } = await q;
      if (cancelled) return;
      if (error) setError(error.message);
      else setEvents(data);
      setLoading(false);
    }
    const t = setTimeout(load, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, category]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Campus Event</h1>
      <div className="mt-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Event"
          className="w-64 rounded-md border border-slate-300 px-3 py-2"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2"
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {error && <p className="mt-6 text-red-600">{error}</p>}
      {loading ? (
        <p className="mt-6 text-slate-500">Loading...</p>
      ) : events.length === 0 ? (
        <p className="mt-6 text-slate-500">
          No events match your criteria. Try changing your search term or
          category.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {events.map((e) => (
            <li
              key={e.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <p className="text-xs text-indigo-600">{e.category}</p>
              <h2 className="mt-1 font-semibold">{e.title}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {new Date(e.starts_at).toLocaleString("ko-KR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {e.location && ` · ${e.location}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
