import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../store/cart";

const linkClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-md text-sm ${isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`;

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const navigate = useNavigate();

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
        <Link to="/" className="mr-4 text-lg font-bold text-indigo-600">
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

        <div className="ml-auto flex items-center gap-2">
          <NavLink to="/cart" className={linkClass}>
            Cart ({cartCount})
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
