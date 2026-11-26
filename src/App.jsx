import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import EventManagement from "./pages/EventManagement";

// Sprint 3: Attendance check-in page
import Attendance from "./pages/Attendance";
import OrganizerEvents from "./pages/OrganizerEvents";
import Store from "./pages/Store";
import ProductDetails from "./pages/ProductDetails";

import MyEvents from "./pages/MyEvents";

// Sprint 3: Shopping Cart page
import Cart from "./pages/Cart";

// Sprint 5: Animated checkout and payment page
import Checkout from "./pages/Checkout";

// Sprint 5: Customer merchandise order history
import MyOrders from "./pages/MyOrders";

// Sprint 5: Central administration dashboard
import AdminDashboard from "./pages/AdminDashboard";

// Sprint 5: Admin order management dashboard
import AdminOrders from "./pages/AdminOrders";

// Sprint 5: Admin merchandise management
import AdminProducts from "./pages/AdminProducts";

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

          {/* Sprint 5: Checkout requires an authenticated user */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />

          {/* Sprint 5: Customer order history requires authentication */}
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />

          {/* Customer registered events */}
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

          {/* Edit an existing event */}
          <Route
            path="/organizer/edit/:id"
            element={
              <ProtectedRoute roles={["organizer", "admin"]}>
                <EventManagement />
              </ProtectedRoute>
            }
          />

          {/* Sprint 3: Events hosted by the organizer */}
          <Route
            path="/organizer/events"
            element={
              <ProtectedRoute roles={["organizer", "admin"]}>
                <OrganizerEvents />
              </ProtectedRoute>
            }
          />

          {/* Sprint 3: Attendance check-in */}
          <Route
            path="/organizer/attendance/:id"
            element={
              <ProtectedRoute roles={["organizer", "admin"]}>
                <Attendance />
              </ProtectedRoute>
            }
          />

          {/* Sprint 5: Admin dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Sprint 5: Admin order management */}
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminOrders />
              </ProtectedRoute>
            }
          />

          {/* Sprint 5: Admin merchandise management */}
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminProducts />
              </ProtectedRoute>
            }
          />

        </Routes>
      </main>

      {/* Footer visible on every page */}
      <Footer />

    </div>
  );
}