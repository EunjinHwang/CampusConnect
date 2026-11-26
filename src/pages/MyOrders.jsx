import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

// CampusConnect - Sprint 5
// Displays customer merchandise orders and cancellation options.

// Display colours for each order status.
const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-slate-100 text-slate-700",
};

// Format prices using the order currency.
function formatPrice(amount, currency = "cad") {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number(amount || 0));
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const submitting = useRef(false);

  // Retrieve orders belonging to the signed-in customer.
  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Please sign in to view your orders.");
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          user_id,
          status,
          subtotal,
          total,
          currency,
          payment_provider,
          created_at,
          order_items (
            id,
            product_id,
            item_name,
            quantity,
            unit_price
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(
        (data || []).filter((order) =>
          order.order_items?.some((item) => item.product_id)
        )
      );
    } catch (err) {
      setOrders([]);
      setError(
        err.message || "Unable to retrieve your orders."
      );
    } finally {
      setLoading(false);
    }
  }

  // Load customer orders when the page opens.
  useEffect(() => {
    loadOrders();
  }, []);

  // Cancel a pending order using the secure database function.
  async function handleCancel(order) {
    if (submitting.current || order.status !== "pending") {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    submitting.current = true;
    setCancelling(order.id);
    setActionError("");
    setMessage("");

    try {
      // The database verifies ownership and restores stock.
      const { error } = await supabase.rpc("cancel_order", {
        p_order_id: order.id,
      });

      if (error) throw error;

      setMessage("Your order has been cancelled successfully.");

      await loadOrders();
    } catch {
      setActionError(
        "Unable to confirm cancellation. Refresh your orders to check the current status."
      );
    } finally {
      submitting.current = false;
      setCancelling(null);
    }
  }

  // Filter orders by their current status.
  const filteredOrders = orders.filter(
    (order) =>
      statusFilter === "all" ||
      order.status === statusFilter
  );

  // Calculate customer order statistics.
  const summaryCards = [
    {
      title: "Total Orders",
      value: orders.length,
      icon: "📦",
    },
    {
      title: "Pending",
      value: orders.filter(
        (order) => order.status === "pending"
      ).length,
      icon: "⏳",
    },
    {
      title: "Shipped",
      value: orders.filter(
        (order) => order.status === "shipped"
      ).length,
      icon: "🚚",
    },
    {
      title: "Completed",
      value: orders.filter(
        (order) => order.status === "completed"
      ).length,
      icon: "✅",
    },
  ];

  return (
    <div className="space-y-6">

      {/* Return to the merchandise store */}
      <Link
        to="/store"
        className="text-sm font-semibold text-[#0E3B2E] hover:underline"
      >
        ← Back to Merchandise Store
      </Link>

      {/* Customer order history banner */}
      <section className="rounded-2xl bg-[#0E3B2E] p-8 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>
            <span className="text-xs font-semibold text-[#CDEBD8]">
              CAMPUSCONNECT STORE
            </span>

            <h1 className="mt-3 text-3xl font-bold">
              My Orders
            </h1>

            <p className="mt-2 text-[#CDEBD8]">
              View your purchases and track your merchandise orders.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            disabled={loading || Boolean(cancelling)}
            className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0E3B2E] hover:bg-[#CDEBD8] disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh Orders"}
          </button>

        </div>
      </section>

      {/* Order statistics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        {summaryCards.map((card) => (
          <article
            key={card.title}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="text-3xl">{card.icon}</div>

            <p className="mt-3 text-sm text-slate-600">
              {card.title}
            </p>

            <p className="mt-2 text-3xl font-bold text-[#0E3B2E]">
              {loading || error ? "—" : card.value}
            </p>
          </article>
        ))}

      </div>

      {/* Successful order cancellation message */}
      {message && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800"
        >
          ✓ {message}
        </div>
      )}

      {/* Order action error message */}
      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
        >
          {actionError}
        </div>
      )}

      {/* Order status filter */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-5 shadow-sm">

        <h2 className="text-lg font-bold text-[#0E3B2E]">
          Order History
        </h2>

        <select
          aria-label="Filter orders by status"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="shipped">Shipped</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>

      </section>

      {/* Loading state */}
      {loading && (
        <div
          role="status"
          className="rounded-xl bg-white p-10 text-center"
        >
          Loading your orders...
        </div>
      )}

      {/* Database error handling */}
      {!loading && error && (
        <section
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-6"
        >
          <h2 className="font-bold text-amber-900">
            Orders Unavailable
          </h2>

          <p className="mt-2 text-sm text-amber-800">
            Your orders could not be retrieved at this time.
          </p>

          <button
            type="button"
            onClick={loadOrders}
            className="mt-4 rounded-lg bg-[#0E3B2E] px-4 py-2 text-sm font-semibold text-white"
          >
            Try Again
          </button>
        </section>
      )}

      {/* Empty order history */}
      {!loading && !error && filteredOrders.length === 0 && (
        <section className="rounded-xl border bg-white p-10 text-center shadow-sm">

          <div className="text-6xl">📦</div>

          <h2 className="mt-4 text-xl font-bold text-[#0E3B2E]">
            No Orders Found
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {orders.length === 0
              ? "You have not placed any merchandise orders yet."
              : "No orders match the selected status."}
          </p>

          <Link
            to="/store"
            className="mt-5 inline-block rounded-lg bg-[#0E3B2E] px-6 py-3 font-semibold text-white"
          >
            Browse Merchandise
          </Link>

        </section>
      )}

      {/* Display individual customer orders */}
      {!loading && !error && filteredOrders.map((order) => (
        <article
          key={order.id}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >

          {/* Order header */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#CDEBD8]/40 p-5">

            <div>
              <p className="text-xs font-semibold text-slate-600">
                ORDER NUMBER
              </p>

              <h3 className="mt-1 font-bold text-[#0E3B2E]">
                #{order.id.slice(0, 8).toUpperCase()}
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                {new Date(order.created_at).toLocaleDateString("en-CA")}
              </p>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                statusColors[order.status] ||
                "bg-slate-100 text-slate-700"
              }`}
            >
              {order.status}
            </span>

          </div>

          {/* Order summary */}
          <div className="p-5">

            {order.order_items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 border-b py-4"
              >

                <div className="flex items-center gap-4">

                  <div className="rounded-xl bg-emerald-50 p-3 text-2xl">
                    🛍️
                  </div>

                  <div>
                    <p className="font-semibold">
                      {item.item_name}
                    </p>

                    <p className="text-sm text-slate-600">
                      Quantity: {item.quantity}
                    </p>
                  </div>

                </div>

                <p className="font-bold text-[#0E3B2E]">
                  {formatPrice(
                    item.unit_price * item.quantity,
                    order.currency
                  )}
                </p>

              </div>
            ))}

            {/* Order total */}
            <div className="mt-5 flex justify-between text-lg font-bold text-[#0E3B2E]">
              <span>Order Total</span>

              <span>
                {formatPrice(order.total, order.currency)}
              </span>
            </div>

            {/* Demonstration payment notice */}
            {order.payment_provider === "demo" && (
              <p className="mt-3 text-xs text-slate-500">
                Demonstration order. No real payment was charged.
              </p>
            )}

            {/* Order actions */}
            <div className="mt-5 flex flex-wrap gap-3">

              <button
                type="button"
                aria-expanded={expandedOrder === order.id}
                onClick={() =>
                  setExpandedOrder(
                    expandedOrder === order.id
                      ? null
                      : order.id
                  )
                }
                className="rounded-lg border border-[#0E3B2E] px-4 py-2 text-sm font-semibold text-[#0E3B2E] hover:bg-emerald-50"
              >
                {expandedOrder === order.id
                  ? "Hide Details"
                  : "View Details"}
              </button>

              {order.status === "pending" && (
                <button
                  type="button"
                  onClick={() => handleCancel(order)}
                  disabled={Boolean(cancelling)}
                  className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {cancelling === order.id
                    ? "Cancelling..."
                    : "Cancel Order"}
                </button>
              )}

            </div>

            {/* Full order information */}
            {expandedOrder === order.id && (
              <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">

                <p className="break-all">
                  <strong>Confirmation ID:</strong>{" "}
                  {order.id}
                </p>

                <p>
                  <strong>Order Date:</strong>{" "}
                  {new Date(order.created_at).toLocaleString("en-CA")}
                </p>

                <p className="capitalize">
                  <strong>Status:</strong>{" "}
                  {order.status}
                </p>

                <p>
                  <strong>Subtotal:</strong>{" "}
                  {formatPrice(order.subtotal, order.currency)}
                </p>

                <p>
                  <strong>Total:</strong>{" "}
                  {formatPrice(order.total, order.currency)}
                </p>

                {order.order_items?.map((item) => (
                  <p key={item.id}>
                    {item.item_name} —{" "}
                    {formatPrice(item.unit_price, order.currency)}
                    {" × "}{item.quantity}
                  </p>
                ))}

              </div>
            )}

          </div>
        </article>
      ))}

      {/* Continue shopping */}
      <div className="pb-4 text-center">
        <Link
          to="/store"
          className="inline-block rounded-lg bg-[#0E3B2E] px-6 py-3 font-semibold text-white hover:opacity-90"
        >
          Continue Shopping
        </Link>
      </div>

    </div>
  );
}