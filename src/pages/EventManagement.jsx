import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

const CATEGORIES = [
  "Academic",
  "Clubs",
  "Sports",
  "Culture",
  "Career",
];

const initialForm = {
  title: "",
  description: "",
  category: "",
  location: "",
  starts_at: "",
  ends_at: "",
  image_url: "",
};

// Added: ticket tier rows live in the form. `id` is set once saved to Supabase.
let tierCounter = 0;
const newTier = (overrides = {}) => ({
  key: `tier-${++tierCounter}`,
  id: null,
  name: "",
  price: "0",
  capacity: "",
  description: "",
  ...overrides,
});
// New events start with one free tier so publishing works out of the box.
const defaultTiers = () => [newTier({ name: "General Admission" })];

// Convert local datetime to UTC for Supabase
const toISO = (value) =>
  value ? new Date(value).toISOString() : null;

// Convert Supabase UTC datetime to datetime-local format
function toLocalDateTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 16);
}

const display = {
  fontFamily:
    '"Bricolage Grotesque Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
};

const focusPine =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E3B2E]";

export default function EventManagement() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Added: Detect Create or Edit mode
  const isEditing = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [eventStatus, setEventStatus] = useState("draft");
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Added: Ticket tiers (editable list) and the ids that already exist in Supabase
  const [tiers, setTiers] = useState(isEditing ? [] : defaultTiers());
  const [originalTierIds, setOriginalTierIds] = useState([]);
  const [tierErrors, setTierErrors] = useState({}); // { [tier.key]: { name, price, capacity } }
  const [tiersError, setTiersError] = useState("");

  // Added: Validation and user feedback
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Added: Prevent updates to events belonging to others
  const [canEdit, setCanEdit] = useState(!isEditing);

  const redirectTimer = useRef(null);
  // Added: once the event row exists, retries must update it instead of inserting a duplicate
  const eventIdRef = useRef(id ?? null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  // Added: Load an existing event when editing
  useEffect(() => {
    eventIdRef.current = id ?? null;

    if (!isEditing) {
      setForm(initialForm);
      setEventStatus("draft");
      setTiers(defaultTiers());
      setOriginalTierIds([]);
      setTierErrors({});
      setTiersError("");
      setCanEdit(true);
      setLoading(false);
      setError("");
      setSuccess("");
      setFieldErrors({});
      return;
    }

    let cancelled = false;

    async function loadEvent() {
      setLoading(true);
      setCanEdit(false);
      setError("");
      setSuccess("");
      setFieldErrors({});

      try {
        // Get current signed-in user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error("Please log in to edit events.");
        }

        // Read only the selected event
        const { data, error: loadError } = await supabase
          .from("events")
          .select(
            "id, organizer_id, title, description, category, location, starts_at, ends_at, image_url, status"
          )
          .eq("id", id)
          .single();

        if (loadError) throw loadError;

        if (!data) {
          throw new Error("Event not found.");
        }

        // Added: Only allow the event owner to edit
        if (data.organizer_id !== user.id) {
          throw new Error(
            "You can only edit events created by your account."
          );
        }

        // Added: Load this event's active ticket tiers
        const { data: tierData, error: tierLoadError } = await supabase
          .from("ticket_tiers")
          .select("id, name, price, capacity, description")
          .eq("event_id", id)
          .eq("is_active", true)
          .order("sort_order")
          .order("price");

        if (tierLoadError) throw tierLoadError;

        if (cancelled) return;

        setForm({
          title: data.title || "",
          description: data.description || "",
          category: data.category || "",
          location: data.location || "",
          starts_at: toLocalDateTime(data.starts_at),
          ends_at: toLocalDateTime(data.ends_at),
          image_url: data.image_url || "",
        });

        setTiers(
          (tierData ?? []).map((t) =>
            newTier({
              id: t.id,
              name: t.name || "",
              price: String(t.price ?? 0),
              capacity: t.capacity ? String(t.capacity) : "",
              description: t.description || "",
            })
          )
        );
        setOriginalTierIds((tierData ?? []).map((t) => t.id));

        setEventStatus(data.status || "draft");
        setCanEdit(true);
      } catch (err) {
        if (!cancelled) {
          console.error("Could not load event:", err);
          setError(err.message || "Could not load event.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadEvent();

    return () => {
      cancelled = true;
    };
  }, [id, isEditing]);

  // Added: Update form and clear errors
  const update = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setError("");
  };

  // Added: ticket tier handlers
  const updateTier = (key, field, value) => {
    setTiers((list) =>
      list.map((t) => (t.key === key ? { ...t, [field]: value } : t))
    );
    setTierErrors((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: "" },
    }));
    setTiersError("");
    setError("");
  };

  const addTier = () => setTiers((list) => [...list, newTier()]);

  const removeTier = (key) => {
    setTiers((list) => list.filter((t) => t.key !== key));
    setTiersError("");
  };

  // Added: Validate Create and Edit forms
  const validateForm = (status) => {
    const errors = {};
    const title = form.title.trim();

    if (!title) {
      errors.title = "Event name is required.";
    } else if (title.length < 3) {
      errors.title =
        "Event name must contain at least 3 characters.";
    }

    if (status === "published" && !form.starts_at) {
      errors.starts_at =
        "Please select a start date and time.";
    }

    const start = form.starts_at
      ? new Date(form.starts_at)
      : null;

    const end = form.ends_at
      ? new Date(form.ends_at)
      : null;

    if (start && Number.isNaN(start.getTime())) {
      errors.starts_at = "Please enter a valid start date.";
    }

    if (end && Number.isNaN(end.getTime())) {
      errors.ends_at = "Please enter a valid end date.";
    }

    // Only newly published events must start in the future.
    // Existing events may have started already.
    if (
      status === "published" &&
      start &&
      !Number.isNaN(start.getTime()) &&
      start <= new Date() &&
      (!isEditing || eventStatus !== "published")
    ) {
      errors.starts_at =
        "The event must start in the future.";
    }

    if (
      start &&
      end &&
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end <= start
    ) {
      errors.ends_at =
        "End time must be after start time.";
    }

    if (end && !start) {
      errors.starts_at =
        "Please select a start date before the end date.";
    }

    if (form.image_url.trim()) {
      try {
        const url = new URL(form.image_url.trim());

        if (!["http:", "https:"].includes(url.protocol)) {
          errors.image_url =
            "Please enter a valid HTTP or HTTPS image link.";
        }
      } catch {
        errors.image_url =
          "Please enter a valid image URL.";
      }
    }

    // Added: ticket tier validation
    const nextTierErrors = {};
    tiers.forEach((t) => {
      const e = {};
      if (!t.name.trim()) e.name = "Name is required.";
      const price = Number(t.price);
      if (t.price === "" || Number.isNaN(price) || price < 0) {
        e.price = "Enter 0 or more.";
      }
      if (t.capacity !== "") {
        const cap = Number(t.capacity);
        if (!Number.isInteger(cap) || cap < 1) e.capacity = "Whole number, 1+.";
      }
      if (Object.keys(e).length) nextTierErrors[t.key] = e;
    });

    let nextTiersError = "";
    if (status === "published" && tiers.length === 0) {
      nextTiersError = "Add at least one ticket tier before publishing.";
    }

    setFieldErrors(errors);
    setTierErrors(nextTierErrors);
    setTiersError(nextTiersError);

    return (
      Object.keys(errors).length === 0 &&
      Object.keys(nextTierErrors).length === 0 &&
      !nextTiersError
    );
  };

  // Added: save tier rows for an event. New tiers are inserted, edited ones updated,
  // and removed ones are deactivated (not deleted) so existing registrations keep their ticket.
  const syncTiers = async (eventId) => {
    const keptIds = tiers.filter((t) => t.id).map((t) => t.id);
    const removedIds = originalTierIds.filter((tid) => !keptIds.includes(tid));

    if (removedIds.length > 0) {
      const { error: removeError } = await supabase
        .from("ticket_tiers")
        .update({ is_active: false })
        .in("id", removedIds);
      if (removeError) throw removeError;
    }

    const toRow = (t, index) => ({
      name: t.name.trim(),
      price: Number(t.price),
      capacity: t.capacity === "" ? null : Number(t.capacity),
      description: t.description.trim() || null,
      is_active: true,
      sort_order: index,
    });

    const nextTiers = [...tiers];

    // Update existing tiers
    for (const [index, t] of tiers.entries()) {
      if (!t.id) continue;
      const { error: updateError } = await supabase
        .from("ticket_tiers")
        .update(toRow(t, index))
        .eq("id", t.id);
      if (updateError) throw updateError;
    }

    // Insert new tiers
    const fresh = tiers
      .map((t, index) => ({ t, index }))
      .filter(({ t }) => !t.id);

    if (fresh.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from("ticket_tiers")
        .insert(
          fresh.map(({ t, index }) => ({ event_id: eventId, ...toRow(t, index) }))
        )
        .select("id");
      if (insertError) throw insertError;
      if (!inserted || inserted.length !== fresh.length) {
        throw new Error("Ticket tiers were not saved. Check your permissions.");
      }
      fresh.forEach(({ index }, i) => {
        nextTiers[index] = { ...nextTiers[index], id: inserted[i].id };
      });
    }

    // Remember the saved ids so a retry doesn't create duplicates
    setTiers(nextTiers);
    setOriginalTierIds(nextTiers.map((t) => t.id));
  };

  // Updated: Create or update event in Supabase
  const save = async (status) => {
    if (saving || loading || !canEdit || success) return;

    setError("");
    setSuccess("");

    if (!validateForm(status)) {
      setError("Please correct the highlighted fields.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          "Please log in before saving an event."
        );
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category || null,
        location: form.location.trim() || null,
        starts_at: toISO(form.starts_at),
        ends_at: toISO(form.ends_at),
        image_url: form.image_url.trim() || null,
      };

      let eventId = eventIdRef.current;
      let createdNow = false;

      // Step 1: make sure the event row exists. New events are always inserted as a draft
      // first, because the database won't let an event without an active tier be published.
      if (!eventId) {
        const { data, error: insertError } = await supabase
          .from("events")
          .insert({
            ...payload,
            status: "draft",
            organizer_id: user.id,
          })
          .select("id");

        if (insertError) throw insertError;

        if (!data || data.length === 0) {
          throw new Error(
            "No event was saved. Check your permissions."
          );
        }

        eventId = data[0].id;
        eventIdRef.current = eventId;
        createdNow = true;
      }

      // Step 2: save the ticket tiers
      await syncTiers(eventId);

      // Step 3: save the event with its final status (now that a tier exists)
      if (!createdNow || status !== "draft") {
        const { data, error: updateError } = await supabase
          .from("events")
          .update({ ...payload, status })
          .eq("id", eventId)
          .eq("organizer_id", user.id)
          .select("id");

        if (updateError) throw updateError;

        if (!data || data.length === 0) {
          throw new Error(
            "No event was saved. Check your permissions."
          );
        }
      }

      setEventStatus(status);

      setSuccess(
        isEditing
          ? status === "published"
            ? "Event updated and published successfully!"
            : "Event changes saved successfully!"
          : status === "published"
            ? "Event published successfully!"
            : "Draft saved successfully!"
      );

      redirectTimer.current = setTimeout(() => {
        navigate("/events");
      }, 1500);
    } catch (err) {
      console.error("Event save failed:", err);

      // If the event row was created but a later step failed, say so.
      const partial =
        !isEditing && eventIdRef.current
          ? " Your event was saved as a draft."
          : "";

      setError(
        `Could not save event: ${
          err.message || "Please try again."
        }${partial}`
      );
    } finally {
      setSaving(false);
    }
  };

  // Existing: Live event flyer preview
  const start = form.starts_at
    ? new Date(form.starts_at)
    : null;

  const validStart =
    start && !Number.isNaN(start.getTime());

  const month = validStart
    ? start.toLocaleString("en-US", {
        month: "short",
      })
    : "Date";

  const day = validStart
    ? start.getDate()
    : "--";

  const time = validStart
    ? start.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  const field =
    "w-full rounded-xl border-2 border-[#10201A]/15 bg-[#FAF9F5] px-4 py-3 text-[#10201A] " +
    "placeholder:text-[#10201A]/40 transition-colors focus:border-[#0E3B2E] focus:outline-none";

  // Added: slightly tighter input for the ticket tier rows
  const tierField =
    "w-full rounded-lg border-2 border-[#10201A]/15 bg-white px-3 py-2 text-sm text-[#10201A] " +
    "placeholder:text-[#10201A]/40 transition-colors focus:border-[#0E3B2E] focus:outline-none";

  const label =
    "mb-1.5 block text-sm font-semibold text-[#10201A]";

  const errorClass =
    "mt-1.5 text-sm font-medium text-red-600";

  // Added: Loading screen
  if (loading) {
    return (
      <div className="py-16 text-center text-slate-600">
        Loading event information...
      </div>
    );
  }

  // Added: Block editing when owner check fails
  if (isEditing && !canEdit) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Event unavailable
        </h1>

        <p className="mt-3 text-red-600">
          {error || "You cannot edit this event."}
        </p>

        <button
          type="button"
          onClick={() => navigate("/events")}
          className="mt-6 rounded-xl bg-[#0E3B2E] px-5 py-3 font-semibold text-white"
        >
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <section className="rounded-[2rem] bg-[#0E3B2E] px-6 py-10 sm:px-12 sm:py-12">
        <h1
          className="text-4xl font-extrabold leading-[1.05] tracking-tight text-[#FAF9F5] sm:text-5xl"
          style={display}
        >
          {isEditing ? "Edit event" : "Create an event"}
        </h1>

        <p className="mt-4 max-w-md text-lg text-[#CDEBD8]">
          {isEditing
            ? "Update your event details and save your changes."
            : "Save a draft to finish later, or publish when it's ready for students to see."}
        </p>
      </section>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Event form */}
        <form
          onSubmit={(e) => e.preventDefault()}
          noValidate
          className="space-y-6 rounded-3xl border border-[#10201A]/10 bg-white p-6 sm:p-8"
        >
          {/* Event name */}
          <div>
            <label htmlFor="title" className={label}>
              Event name *
            </label>

            <input
              id="title"
              name="title"
              value={form.title}
              onChange={update}
              className={field}
              placeholder="e.g. Fall Career Fair"
              aria-invalid={!!fieldErrors.title}
              required
            />

            {fieldErrors.title && (
              <p className={errorClass}>
                {fieldErrors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className={label}
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              rows={4}
              value={form.description}
              onChange={update}
              className={field}
              placeholder="What should people know before they come?"
            />
          </div>

          {/* Category */}
          <div>
            <span
              className={label}
              id="category-label"
            >
              Category
            </span>

            <div
              role="radiogroup"
              aria-labelledby="category-label"
              className="flex flex-wrap gap-2"
            >
              {CATEGORIES.map((category) => {
                const active =
                  form.category === category;

                return (
                  <button
                    key={category}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={saving}
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        category: active
                          ? ""
                          : category,
                      }))
                    }
                    className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors ${focusPine} ${
                      active
                        ? "border-[#0E3B2E] bg-[#0E3B2E] text-[#FAF9F5]"
                        : "border-[#10201A]/15 text-[#10201A] hover:border-[#0E3B2E]"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className={label}
            >
              Location
            </label>

            <input
              id="location"
              name="location"
              value={form.location}
              onChange={update}
              className={field}
              placeholder="Building and room"
            />
          </div>

          {/* Event dates */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="starts_at"
                className={label}
              >
                Starts *
              </label>

              <input
                id="starts_at"
                name="starts_at"
                type="datetime-local"
                value={form.starts_at}
                onChange={update}
                className={field}
                aria-invalid={!!fieldErrors.starts_at}
              />

              {fieldErrors.starts_at && (
                <p className={errorClass}>
                  {fieldErrors.starts_at}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="ends_at"
                className={label}
              >
                Ends
              </label>

              <input
                id="ends_at"
                name="ends_at"
                type="datetime-local"
                value={form.ends_at}
                onChange={update}
                className={field}
                aria-invalid={!!fieldErrors.ends_at}
              />

              {fieldErrors.ends_at && (
                <p className={errorClass}>
                  {fieldErrors.ends_at}
                </p>
              )}
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label
              htmlFor="image_url"
              className={label}
            >
              Image link
            </label>

            <input
              id="image_url"
              name="image_url"
              type="url"
              value={form.image_url}
              onChange={update}
              className={field}
              placeholder="https://..."
              aria-invalid={!!fieldErrors.image_url}
            />

            {fieldErrors.image_url && (
              <p className={errorClass}>
                {fieldErrors.image_url}
              </p>
            )}
          </div>

          {/* Added: Ticket tiers */}
          <fieldset className="border-t border-[#10201A]/10 pt-6">
            <legend className={label}>Ticket tiers</legend>
            <p className="-mt-1 mb-3 text-sm text-[#10201A]/60">
              At least one tier is needed to publish. Set the price to 0 for a free ticket.
            </p>

            <div className="space-y-3">
              {tiers.map((tier, index) => {
                const errs = tierErrors[tier.key] || {};
                return (
                  <div
                    key={tier.key}
                    className="rounded-xl border border-[#10201A]/10 bg-[#FAF9F5] p-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-[1fr_6rem_6rem]">
                      <div>
                        <label
                          htmlFor={`tier-name-${tier.key}`}
                          className="mb-1 block text-xs font-semibold text-[#10201A]"
                        >
                          Name *
                        </label>
                        <input
                          id={`tier-name-${tier.key}`}
                          value={tier.name}
                          onChange={(e) => updateTier(tier.key, "name", e.target.value)}
                          className={tierField}
                          placeholder="e.g. General Admission"
                          aria-invalid={!!errs.name}
                        />
                        {errs.name && <p className="mt-1 text-xs font-medium text-red-600">{errs.name}</p>}
                      </div>

                      <div>
                        <label
                          htmlFor={`tier-price-${tier.key}`}
                          className="mb-1 block text-xs font-semibold text-[#10201A]"
                        >
                          Price ($)
                        </label>
                        <input
                          id={`tier-price-${tier.key}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={tier.price}
                          onChange={(e) => updateTier(tier.key, "price", e.target.value)}
                          className={tierField}
                          aria-invalid={!!errs.price}
                        />
                        {errs.price && <p className="mt-1 text-xs font-medium text-red-600">{errs.price}</p>}
                      </div>

                      <div>
                        <label
                          htmlFor={`tier-capacity-${tier.key}`}
                          className="mb-1 block text-xs font-semibold text-[#10201A]"
                        >
                          Capacity
                        </label>
                        <input
                          id={`tier-capacity-${tier.key}`}
                          type="number"
                          min="1"
                          step="1"
                          value={tier.capacity}
                          onChange={(e) => updateTier(tier.key, "capacity", e.target.value)}
                          className={tierField}
                          placeholder="No limit"
                          aria-invalid={!!errs.capacity}
                        />
                        {errs.capacity && <p className="mt-1 text-xs font-medium text-red-600">{errs.capacity}</p>}
                      </div>
                    </div>

                    <div className="mt-3 flex items-end gap-3">
                      <div className="flex-1">
                        <label
                          htmlFor={`tier-desc-${tier.key}`}
                          className="mb-1 block text-xs font-semibold text-[#10201A]"
                        >
                          Description
                        </label>
                        <input
                          id={`tier-desc-${tier.key}`}
                          value={tier.description}
                          onChange={(e) => updateTier(tier.key, "description", e.target.value)}
                          className={tierField}
                          placeholder="Optional"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTier(tier.key)}
                        disabled={saving}
                        aria-label={`Remove ticket tier ${index + 1}`}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold text-[#10201A]/60 hover:bg-white hover:text-red-600 ${focusPine}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {tiers.length === 0 && (
              <p className="rounded-xl border border-dashed border-[#10201A]/20 px-4 py-3 text-sm text-[#10201A]/60">
                No ticket tiers yet. You can save a draft without one, but you'll need one to publish.
              </p>
            )}

            {tiersError && <p className={errorClass}>{tiersError}</p>}

            <button
              type="button"
              onClick={addTier}
              disabled={saving}
              className={`mt-3 rounded-full border-2 border-[#0E3B2E] px-4 py-1.5 text-sm font-semibold text-[#0E3B2E] transition-colors hover:bg-[#CDEBD8]/50 ${focusPine}`}
            >
              + Add ticket tier
            </button>
          </fieldset>

          {/* Added: Error and success feedback */}
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {error}
            </p>
          )}

          {success && (
            <p
              role="status"
              className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
            >
              ✓ {success}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 border-t border-[#10201A]/10 pt-6">
            <button
              type="button"
              disabled={saving || !!success}
              onClick={() => save("published")}
              className={`rounded-full bg-[#0E3B2E] px-6 py-3 font-semibold text-[#FAF9F5] transition-colors hover:bg-[#10201A] disabled:opacity-60 ${focusPine}`}
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save & publish"
                  : "Publish event"}
            </button>

            <button
              type="button"
              disabled={saving || !!success}
              onClick={() => save("draft")}
              className={`rounded-full border-2 border-[#0E3B2E] px-6 py-3 font-semibold text-[#0E3B2E] transition-colors hover:bg-[#CDEBD8]/50 disabled:opacity-60 ${focusPine}`}
            >
              {isEditing ? "Save as draft" : "Save draft"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => navigate(-1)}
              className={`rounded-full px-4 py-3 font-semibold text-[#10201A]/70 hover:text-[#10201A] ${focusPine}`}
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Existing: Live flyer preview */}
        <aside
          aria-label="Event flyer preview"
          className="rounded-3xl bg-[#0E3B2E] px-6 py-10 lg:sticky lg:top-6"
        >
          <p className="mb-8 text-sm font-semibold text-[#CDEBD8]">
            How it will look
          </p>

          <div className="relative mx-auto w-full max-w-[15rem] -rotate-2 rounded-sm bg-[#FFC93C] p-5 text-[#10201A] shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
            <span className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 rotate-2 bg-white/60" />

            <p className="text-sm font-semibold">
              {month}
            </p>

            <p
              className="text-6xl font-extrabold leading-none"
              style={display}
            >
              {day}
            </p>

            <p
              className="mt-4 break-words text-xl font-bold leading-snug"
              style={display}
            >
              {form.title.trim() ||
                "Your event name"}
            </p>

            <p className="mt-1 text-sm">
              {form.location.trim() ||
                "Location"}
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