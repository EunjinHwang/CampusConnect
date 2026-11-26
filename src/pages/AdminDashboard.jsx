import { Link } from "react-router-dom";

// Sprint 5: CampusConnect Admin Dashboard
// Provides central access to administration features

export default function AdminDashboard() {

  // Administration sections and navigation links
  const sections = [
    {
      title: "Order Management",
      description: "View customer orders, order details and order statuses.",
      icon: "📦",
      path: "/admin/orders",
      button: "View Orders",
      available: true,
    },
    {
      title: "Merchandise Management",
      description: "Manage merchandise products, prices and stock levels.",
      icon: "🛍️",
      path: "/admin/products",
      button: "Manage Products",
      available: true,
    },
    {
      title: "Event Management",
      description: "Create, edit and manage campus events.",
      icon: "📅",
      path: "/organizer",
      button: "Manage Events",
      available: true,
    },
    {
      title: "Hosted Events",
      description: "View event registrations and manage attendance.",
      icon: "👥",
      path: "/organizer/events",
      button: "View Hosted Events",
      available: true,
    },
  ];

  // ATOM-E2 development team members and profile pictures
  const developers = [
    {
      name: "Antonio",
      image: "antonio.png",
    },
    {
      name: "Tushar",
      image: "tushar.png",
    },
    {
      name: "Omar",
      image: "omar.png",
    },
    {
      name: "Mario",
      image: "mario.png",
    },
    {
      name: "Erivera",
      image: "erivera.png",
    },
    {
      name: "Eunjin",
      image: "eunjin.png",
    },
  ];

  return (
    <div className="space-y-8">

      {/* Dashboard welcome banner */}
      <section className="rounded-2xl bg-[#0E3B2E] p-8 text-white shadow-md">

        <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold">
          ADMINISTRATION
        </span>

        <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
          Admin Dashboard
        </h1>

        <p className="mt-3 text-[#CDEBD8]">
          Welcome to the CampusConnect administration centre.
          Manage your campus platform from one place.
        </p>

      </section>

      {/* Administration section heading */}
      <div>
        <h2 className="text-2xl font-bold text-[#10201A]">
          Management Centre
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Select a section to manage CampusConnect.
        </p>
      </div>

      {/* Management cards */}
      <div className="grid gap-6 sm:grid-cols-2">

        {sections.map((section) => (
          <article
            key={section.title}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >

            {/* Section icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#CDEBD8]/50 text-3xl">
              {section.icon}
            </div>

            {/* Section information */}
            <h3 className="mt-5 text-xl font-bold text-[#0E3B2E]">
              {section.title}
            </h3>

            <p className="mb-6 mt-2 flex-1 text-sm leading-relaxed text-slate-600">
              {section.description}
            </p>

            {/* Navigation to available management pages */}
            {section.available ? (
              <Link
                to={section.path}
                className="rounded-lg bg-[#0E3B2E] px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#10201A]"
              >
                {section.button} →
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-lg bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-500"
              >
                Coming Soon
              </button>
            )}

          </article>
        ))}

      </div>

      {/* Administrator access information */}
      <div className="rounded-xl border border-[#CDEBD8] bg-[#CDEBD8]/20 p-5">

        <h3 className="font-semibold text-[#0E3B2E]">
          🔒 Administrator Access
        </h3>

        <p className="mt-2 text-sm text-slate-600">
          This dashboard is restricted to authorized CampusConnect
          administrators.
        </p>

      </div>

      {/* Sprint 5: Development team section */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Development team heading */}
        <div className="bg-[#0E3B2E] px-6 py-8 text-center text-white">

          <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold tracking-widest">
            ATOM-E2
          </span>

          <h2 className="mt-5 text-2xl font-bold sm:text-3xl">
            Meet Our Development Team
          </h2>

          <p className="mt-3 text-sm text-[#CDEBD8]">
            The team behind CampusConnect
          </p>

        </div>

        {/* Responsive developer profile cards */}
        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">

          {developers.map((developer) => (
            <article
              key={developer.name}
              className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-emerald-500 hover:bg-white hover:shadow-xl motion-reduce:transform-none motion-reduce:transition-none"
            >

              {/* Developer profile picture */}
              <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-[#CDEBD8] shadow-md transition-colors duration-300 group-hover:border-emerald-600">

                <img
                  src={`${import.meta.env.BASE_URL}team/${developer.image}`}
                  alt={`${developer.name}'s profile picture`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none"
                  loading="lazy"
                />

              </div>

              {/* Developer name and role */}
              <h3 className="mt-5 text-xl font-bold text-[#0E3B2E]">
                {developer.name}
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Software Developer
              </p>

              <span className="mt-4 inline-block rounded-full bg-[#CDEBD8]/60 px-4 py-1 text-xs font-semibold text-[#0E3B2E]">
                ATOM-E2
              </span>

            </article>
          ))}

        </div>

        {/* Development team credits */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-6 text-center">

          <p className="font-semibold text-[#0E3B2E]">
            Developed by ATOM-E2
          </p>

          <p className="mt-2 text-sm text-slate-600">
            INFO-5103 — Managing Project Applied 2
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Fanshawe College · 2026
          </p>

        </div>

      </section>

    </div>
  );
}