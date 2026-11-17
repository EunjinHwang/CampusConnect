import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../store/cart";

// Theme matches Footer: bg #102A2A, emerald-300 accent, slate-300 text.
const linkClass = ({ isActive }) =>
  `whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
    isActive
      ? "bg-emerald-300 text-[#102A2A]"
      : "text-slate-300 hover:bg-white/10 hover:text-emerald-300"
  }`;

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
    </svg>
  );
}

export default function Navbar() {
  const { user, role, signOut } = useAuth();

  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  const navigate = useNavigate();

  return (
    <header className="border-b border-white/10 bg-[#102A2A]">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-1.5 px-4 py-3">
        <Link
          to="/"
          className="mr-4 rounded-md text-lg font-bold text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          CampusConnect
        </Link>

        <NavLink to="/events" className={linkClass}>
          Event
        </NavLink>

        <NavLink to="/store" className={linkClass}>
          Store
        </NavLink>

        {user && (
          <NavLink to="/my-events" className={linkClass}>
            My Event
          </NavLink>
        )}

        {(role === "organizer" || role === "admin") && (
          <NavLink to="/organizer" end className={linkClass}>
            Event Management
          </NavLink>
        )}

        {/* Sprint 3: Registrations and attendance for hosted events */}
        {(role === "organizer" || role === "admin") && (
          <NavLink to="/organizer/events" className={linkClass}>
            Hosted Events
          </NavLink>
        )}

        {role === "admin" && (
          <NavLink to="/admin" className={linkClass}>
            Store Management
          </NavLink>
        )}

        <div className="ml-auto flex items-center gap-3">
          <NavLink
            to="/cart"
            aria-label={`Shopping cart, ${cartCount} items`}
            title="Shopping Cart"
            className={({ isActive }) =>
              `relative flex items-center justify-center rounded-full p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                isActive
                  ? "bg-emerald-300 text-[#102A2A]"
                  : "text-slate-300 hover:bg-white/10 hover:text-emerald-300"
              }`
            }
          >
            <CartIcon />

            {/* Orange badge only when cart has items */}
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-bold text-white ring-2 ring-[#102A2A]">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </NavLink>

          {user ? (
            <button
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
              className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              Log Out
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-emerald-300 px-4 py-1.5 text-sm font-semibold text-[#102A2A] transition-colors hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Log In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}