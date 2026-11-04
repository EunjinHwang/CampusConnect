
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../store/cart";

const linkClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-md text-sm ${
    isActive
      ? "bg-slate-900 text-white"
      : "text-slate-600 hover:bg-slate-100"
  }`;

// Added: Shopping cart SVG icon
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

  // Existing: Total quantity of shopping cart items
  const cartCount = useCart((s) =>
    s.items.reduce((n, i) => n + i.quantity, 0)
  );

  const navigate = useNavigate();

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
        <Link
          to="/"
          className="mr-4 text-lg font-bold text-indigo-600"
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
          <NavLink to="/organizer" className={linkClass}>
            Event Management
          </NavLink>
        )}

        {role === "admin" && (
          <NavLink to="/admin" className={linkClass}>
            Store Management
          </NavLink>
        )}

        <div className="ml-auto flex items-center gap-3">
          {/* Added: Shopping cart icon and quantity badge */}
          <NavLink
            to="/cart"
            aria-label={`Shopping cart, ${cartCount} items`}
            title="Shopping Cart"
            className={({ isActive }) =>
              `relative flex items-center justify-center rounded-lg p-2 transition-colors ${
                isActive
                  ? "bg-emerald-100 text-emerald-800"
                  : "text-emerald-900 hover:bg-emerald-50"
              }`
            }
          >
            <CartIcon />

            {/* Show orange badge only when cart has items */}
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-bold text-white">
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
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Log Out
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
            >
              Log In
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
