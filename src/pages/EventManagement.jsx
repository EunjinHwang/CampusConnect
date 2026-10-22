import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

const CATEGORIES = ["Academic", "Clubs", "Sports", "Culture", "Career"];

const initialForm = {
  title: "",
  description: "",
  category: "",
  location: "",
  starts_at: "",
  ends_at: "",
  image_url: "",
};

// datetime-local gives local time; convert to UTC ISO for timestamptz
const toISO = (value) => (value ? new Date(value).toISOString() : null);

// Same display face/general theme as the landing page
const display = {
  fontFamily:
    '"Bricolage Grotesque Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
};

const focusPine =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E3B2E]";

export default function EventManagement() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const save = async (status) => {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("events").insert({
      organizer_id: user?.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category || null,
      location: form.location.trim() || null,
      starts_at: toISO(form.starts_at),
      ends_at: toISO(form.ends_at),
      image_url: form.image_url.trim() || null,
      status,
    });

    setSaving(false);

    // TODO: validation and user-facing error handling
    if (error) {
      console.error(error);
      return;
    }

    navigate("/events");
  };

  // Live flyer preview values
  const start = form.starts_at ? new Date(form.starts_at) : null;
  const month = start ? start.toLocaleString("en-US", { month: "short" }) : "Date";
  const day = start ? start.getDate() : "--";
  const time = start
    ? start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "";

  const field =
    "w-full rounded-xl border-2 border-[#10201A]/15 bg-[#FAF9F5] px-4 py-3 text-[#10201A] " +
    "placeholder:text-[#10201A]/40 transition-colors focus:border-[#0E3B2E] focus:outline-none";
  const label = "mb-1.5 block text-sm font-semibold text-[#10201A]";

  return (
    <div className="pb-8">
      {/* Header band */}
      <section className="rounded-[2rem] bg-[#0E3B2E] px-6 py-10 sm:px-12 sm:py-12">
        <h1
          className="text-4xl font-extrabold leading-[1.05] tracking-tight text-[#FAF9F5] sm:text-5xl"
          style={display}
        >
          Create an event
        </h1>
        <p className="mt-4 max-w-md text-lg text-[#CDEBD8]">
          Save a draft to finish later, or publish when it's ready for students
          to see.
        </p>
      </section>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Form */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-6 rounded-3xl border border-[#10201A]/10 bg-white p-6 sm:p-8"
        >
          <div>
            <label htmlFor="title" className={label}>Event name *</label>
            <input
              id="title" name="title" value={form.title} onChange={update}
              className={field} placeholder="e.g. Fall Career Fair" required
            />
          </div>

          <div>
            <label htmlFor="description" className={label}>Description</label>
            <textarea
              id="description" name="description" rows={4}
              value={form.description} onChange={update}
              className={field} placeholder="What should people know before they come?"
            />
          </div>

          <div>
            <span className={label} id="category-label">Category</span>
            <div
              role="radiogroup" aria-labelledby="category-label"
              className="flex flex-wrap gap-2"
            >
              {CATEGORIES.map((c) => {
                const active = form.category === c;
                return (
                  <button
                    key={c} type="button" role="radio" aria-checked={active}
                    onClick={() =>
                      setForm((f) => ({ ...f, category: active ? "" : c }))
                    }
                    className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors ${focusPine} ${
                      active
                        ? "border-[#0E3B2E] bg-[#0E3B2E] text-[#FAF9F5]"
                        : "border-[#10201A]/15 text-[#10201A] hover:border-[#0E3B2E]"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="location" className={label}>Location</label>
            <input
              id="location" name="location" value={form.location}
              onChange={update} className={field} placeholder="Building and room"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="starts_at" className={label}>Starts *</label>
              <input
                id="starts_at" name="starts_at" type="datetime-local"
                value={form.starts_at} onChange={update} className={field} required
              />
            </div>
            <div>
              <label htmlFor="ends_at" className={label}>Ends</label>
              <input
                id="ends_at" name="ends_at" type="datetime-local"
                value={form.ends_at} onChange={update} className={field}
              />
            </div>
          </div>

          <div>
            <label htmlFor="image_url" className={label}>Image link</label>
            <input
              id="image_url" name="image_url" type="url" value={form.image_url}
              onChange={update} className={field} placeholder="https://..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-[#10201A]/10 pt-6">
            <button
              type="button" disabled={saving} onClick={() => save("published")}
              className={`rounded-full bg-[#0E3B2E] px-6 py-3 font-semibold text-[#FAF9F5] transition-colors hover:bg-[#10201A] disabled:opacity-60 ${focusPine}`}
            >
              {saving ? "Saving..." : "Publish event"}
            </button>
            <button
              type="button" disabled={saving} onClick={() => save("draft")}
              className={`rounded-full border-2 border-[#0E3B2E] px-6 py-3 font-semibold text-[#0E3B2E] transition-colors hover:bg-[#CDEBD8]/50 disabled:opacity-60 ${focusPine}`}
            >
              Save draft
            </button>
            <button
              type="button" disabled={saving} onClick={() => navigate(-1)}
              className={`rounded-full px-4 py-3 font-semibold text-[#10201A]/70 hover:text-[#10201A] ${focusPine}`}
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Live flyer preview */}
        <aside
          aria-label="Event flyer preview"
          className="rounded-3xl bg-[#0E3B2E] px-6 py-10 lg:sticky lg:top-6"
        >
          <p className="mb-8 text-sm font-semibold text-[#CDEBD8]">
            How it will look
          </p>
          <div className="relative mx-auto w-full max-w-[15rem] -rotate-2 rounded-sm bg-[#FFC93C] p-5 text-[#10201A] shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
            <span className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 rotate-2 bg-white/60" />
            <p className="text-sm font-semibold">{month}</p>
            <p className="text-6xl font-extrabold leading-none" style={display}>
              {day}
            </p>
            <p
              className="mt-4 break-words text-xl font-bold leading-snug"
              style={display}
            >
              {form.title.trim() || "Your event name"}
            </p>
            <p className="mt-1 text-sm">
              {form.location.trim() || "Location"}
              {time && ` · ${time}`}
            </p>
            {form.category && (
              <span className="mt-4 inline-block rounded-full bg-[#10201A] px-3 py-1 text-xs font-semibold text-[#FAF9F5]">
                {form.category}
              </span>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}