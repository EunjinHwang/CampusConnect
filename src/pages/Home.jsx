import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, profile } = useAuth();
  return (
    <section className="py-12">
      <h1 className="text-4xl font-bold">
        {user
          ? `Hi, ${profile?.name ?? "Student"}`
          : "All campus activites in one place"}
      </h1>
      <p className="mt-4 max-w-xl text-slate-600">
        Find and register for campus events, and browse event merchandise and
        club products.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          to="/events"
          className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Explore Events
        </Link>
        <Link
          to="/store"
          className="rounded-md border border-slate-300 px-4 py-2 hover:bg-white"
        >
          Go to Store
        </Link>
      </div>
    </section>
  );
}
