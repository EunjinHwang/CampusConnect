import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/*
  Theme/colors used:
     #0E3B2E  hero + primary dark
     #FFC93C  primary accent (buttons, events panel)
     #F2542D  secondary accent (store panel, step numbers)
     #CDEBD8  soft tint (text on pine, signup band)
     #FAF9F5  light text on pine
     #10201A  text on light colors
*/

// Display face. Add the Google Fonts link from the notes to index.html;
// without it the fallback stack is used and everything still works.
const display = {
  fontFamily:
    '"Bricolage Grotesque Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFC93C]";

function Flyer({ className, month, day, title, place }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute w-40 rounded-sm p-4 text-[#10201A] shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-transform duration-200 hover:rotate-0 motion-reduce:transition-none sm:w-48 ${className}`}
    >
      {/* tape */}
      <span className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 rotate-2 bg-white/60" />
      <p className="text-sm font-semibold">{month}</p>
      <p className="text-5xl font-extrabold leading-none" style={display}>
        {day}
      </p>
      <p className="mt-3 font-bold leading-snug" style={display}>
        {title}
      </p>
      <p className="mt-1 text-sm">{place}</p>
    </div>
  );
}

const steps = [
  {
    title: "Find an event",
    body: "Browse what's coming up, from mixers and workshops to career fairs.",
  },
  {
    title: "Register",
    body: "Save your spot in one click. Change your mind and you can cancel anytime.",
  },
  {
    title: "Show up",
    body: "Organizers check you in at the door, so your attendance is on record.",
  },
];

{/* Currently none of the buttons work right now, all just pretty UI elements for now :D */}

export default function Home() {
  const { user, profile } = useAuth();

  return (
    <div className="pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] bg-[#0E3B2E] px-6 py-12 sm:px-12 sm:py-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1
              className="text-4xl font-extrabold leading-[1.05] tracking-tight text-[#FAF9F5] sm:text-6xl"
              style={display}
            >
              {user
                ? `Hi, ${profile?.name ?? "Student"}`
                : "All campus activities in one place"}
            </h1>
            <p className="mt-5 max-w-md text-lg text-[#CDEBD8]">
              Find and register for campus events, and browse event merchandise
              and club products.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/events"
                className={`rounded-full bg-[#FFC93C] px-6 py-3 font-semibold text-[#10201A] transition-colors hover:bg-[#FFD75E] ${focusRing}`}
              >
                Explore events
              </Link>
              <Link
                to="/store"
                className={`rounded-full border-2 border-[#CDEBD8]/50 px-6 py-3 font-semibold text-[#FAF9F5] transition-colors hover:bg-white/10 ${focusRing}`}
              >
                Go to store
              </Link>
            </div>
          </div>

          {/* Flyer collage (decorative sample) */}
          <div className="relative mx-auto h-80 w-full max-w-md sm:h-[22rem]">
            <Flyer
              className="left-0 top-8 -rotate-6 bg-[#FFC93C]"
              month="Oct"
              day="15"
              title="Welcome Week Mixer"
              place="Student Union"
            />
            <Flyer
              className="right-0 top-0 rotate-3 bg-[#F2542D]"
              month="Oct"
              day="20"
              title="Intro to React Workshop"
              place="Room B2035"
            />
            <Flyer
              className="bottom-0 left-14 -rotate-2 bg-[#CDEBD8] sm:left-20"
              month="Nov"
              day="5"
              title="Career Fair"
              place="Main Gym"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-16">
        <h2
          className="text-3xl font-extrabold tracking-tight text-[#10201A]"
          style={display}
        >
          How it works
        </h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="border-t-2 border-[#10201A] pt-4">
              <span
                className="text-5xl font-extrabold text-[#F2542D]"
                style={display}
              >
                {i + 1}
              </span>
              <h3
                className="mt-2 text-xl font-bold text-[#10201A]"
                style={display}
              >
                {step.title}
              </h3>
              <p className="mt-1 text-[#3B4A43]">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Where to go */}
      <section className="mt-16 grid gap-5 md:grid-cols-5">
        <div className="flex min-h-[15rem] flex-col justify-between rounded-3xl bg-[#FFC93C] p-8 md:col-span-3">
          <div>
            <h2
              className="text-3xl font-extrabold tracking-tight text-[#10201A]"
              style={display}
            >
              Events
            </h2>
            <p className="mt-2 max-w-sm text-[#10201A]/80">
              Mixers, workshops, career fairs and more, all in one list.
            </p>
          </div>
          <Link
            to="/events"
            className="mt-8 w-fit rounded-full bg-[#10201A] px-6 py-3 font-semibold text-[#FAF9F5] transition-colors hover:bg-[#0E3B2E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10201A]"
          >
            Explore events
          </Link>
        </div>

        <div className="flex min-h-[15rem] flex-col justify-between rounded-xl bg-[#F2542D] p-8 md:col-span-2">
          <div>
            <h2
              className="text-3xl font-extrabold tracking-tight text-[#10201A]"
              style={display}
            >
              Store
            </h2>
            <p className="mt-2 text-[#10201A]/85">
              Event merchandise and club products.
            </p>
          </div>
          <Link
            to="/store"
            className="mt-8 w-fit rounded-full bg-[#10201A] px-6 py-3 font-semibold text-[#FAF9F5] transition-colors hover:bg-[#0E3B2E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10201A]"
          >
            Go to store
          </Link>
        </div>
      </section>

      {/* Sign-up band (signed-out visitors only) */}
      {!user && (
        <section className="mt-16 gap-6 rounded-3xl bg-[#CDEBD8] px-8 py-10 sm:flex sm:items-center sm:justify-between">
          <div>
            <h2
              className="text-2xl font-extrabold tracking-tight text-[#10201A]"
              style={display}
            >
              Sign up to register for events
            </h2>
            <p className="mt-1 max-w-md text-[#10201A]/80">
              It takes a minute. Your registrations and orders stay in one
              account.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 sm:mt-0">
            <Link
              to="/signup"
              className="rounded-full bg-[#0E3B2E] px-6 py-3 font-semibold text-[#FAF9F5] transition-colors hover:bg-[#10201A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E3B2E]"
            >
              Sign up
            </Link>
            <Link
              to="/login"
              className="rounded-full border-2 border-[#0E3B2E] px-6 py-3 font-semibold text-[#0E3B2E] transition-colors hover:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E3B2E]"
            >
              Log in
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}