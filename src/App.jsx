
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer"; // Added: CampusConnect Footer
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
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* CampusConnect navigation */}
      <Navbar />

      {/* Main content expands to keep Footer at the bottom */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/events" element={<Events />} />

          <Route
            path="/events/:id"
            element={<EventDetails />}
          />

          <Route
            path="/store"
            element={<Placeholder title="Store" />}
          />

          <Route
            path="/cart"
            element={<Placeholder title="Cart" />}
          />

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

          {/* Added: Edit an existing event */}
<Route
  path="/organizer/edit/:id"
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

      {/* Added: Footer visible on every page */}
      <Footer />
    </div>
  );
}
