
import { Link } from "react-router-dom";

// Added: Reusable CampusConnect footer
export default function Footer() {
  return (
    <footer className="bg-[#102A2A] text-white">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-3">
        {/* Added: CampusConnect branding */}
        <div>
          <h2 className="text-2xl font-bold text-emerald-300">
            CampusConnect
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Discover campus events, connect with students,
            and make the most of your college experience.
          </p>
        </div>

        {/* Added: Quick navigation */}
        <div>
          <h3 className="mb-4 font-semibold">Explore</h3>
          <div className="flex flex-col gap-3 text-sm text-slate-300">
            <Link to="/" className="hover:text-emerald-300">Home</Link>
            <Link to="/events" className="hover:text-emerald-300">Events</Link>
            <Link to="/store" className="hover:text-emerald-300">Campus Store</Link>
          </div>
        </div>

        {/* Added: Account navigation */}
        <div>
          <h3 className="mb-4 font-semibold">Your Account</h3>
          <div className="flex flex-col gap-3 text-sm text-slate-300">
            <Link to="/login" className="hover:text-emerald-300">Log In</Link>
            <Link to="/signup" className="hover:text-emerald-300">Sign Up</Link>
            <Link to="/cart" className="hover:text-emerald-300">Shopping Cart</Link>
          </div>
        </div>
      </div>

      {/* Added: Footer copyright section */}
      <div className="border-t border-white/10 px-4 py-5 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} CampusConnect. All rights reserved.
      </div>
    </footer>
  );
}
