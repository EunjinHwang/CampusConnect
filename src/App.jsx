import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Placeholder from "./pages/Placeholder";
import EventManagement from "./pages/EventManagement";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/events" element={<Events />} />

          <Route
            path="/events/:id"
            element={<EventDetails />}
          />
          <Route path="/store" element={<Placeholder title="Store" />} />
          <Route path="/cart" element={<Placeholder title="Cart" />} />
          <Route
            path="/my-events"
            element={
              <ProtectedRoute>
                <Placeholder title="My Event" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer"
            element={
              <ProtectedRoute roles={["organizer", "admin"]}>
                <EventManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Placeholder title="Store & Order Management" />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
