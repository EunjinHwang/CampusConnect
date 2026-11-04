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
// Sprint 3: Attendance check-in page
import Attendance from "./pages/Attendance";
import Store from "./pages/Store";
import ProductDetails from "./pages/ProductDetails";

import MyEvents from "./pages/MyEvents";
// Sprint 3: Shopping Cart page
import Cart from "./pages/Cart";

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

          <Route path="/events/:id" element={<EventDetails />} />

          {/* Sprint 3: Merchandise store */}
          <Route path="/store" element={<Store />} />

          {/* Sprint 3: Individual merchandise product details */}
          <Route path="/store/:id" element={<ProductDetails />} />

          {/* Sprint 3: Shopping Cart */}
          <Route path="/cart" element={<Cart />} />

          <Route
            path="/my-events"
            element={
              <ProtectedRoute>
                <MyEvents />
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

          {/* Sprint 3: Attendance check-in for organizers and admins */}
          <Route
            path="/organizer/attendance/:id"
            element={
              <ProtectedRoute roles={["organizer", "admin"]}>
                <Attendance />
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
