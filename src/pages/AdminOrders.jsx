import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

// Sprint 5: Admin merchandise orders dashboard

const statuses = [
  "pending",
  "paid",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
];

// Display order prices using the stored currency
function formatPrice(amount, currency = "cad") {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number(amount || 0));
}

// Display colours for different order statuses
const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-slate-100 text-slate-700",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const updating = useRef(false);

  // Retrieve merchandise orders and order items
  const loadOrders = async () => {
    setLoading(true);
    setError("");
    setSelectedOrder(null);

    try {
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
        .order("created_at", { ascending: false });

      if (error) throw error;

      const merchandiseOrders = (data || []).filter(
        (order) =>
          order.order_items?.some((item) => item.product_id)
      );

      setOrders(merchandiseOrders);
    } catch (err) {
      setOrders([]);
      setError(err.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  // Apply a permitted status change through the database.
  async function changeStatus(order, nextStatus) {
    if (updating.current) return;

    const prompt = nextStatus === "cancelled"
      ? "Cancel this order and restore its inventory?"
      : `Mark this order as ${nextStatus}?`;

    if (!window.confirm(prompt)) return;

    updating.current = true;
    setSaving(true);
    setActionError("");
    setMessage("");

    try {
      const { error } = await supabase.rpc("update_order_status", {
        p_order_id: order.id,
        p_new_status: nextStatus,
      });

      if (error) throw error;

      setMessage(`Order marked as ${nextStatus}.`);
      await loadOrders();
    } catch (err) {
      setActionError(err.message || "Unable to confirm the status change. Refresh orders before retrying.");
    } finally {
      updating.current = false;
      setSaving(false);
    }
  }

  // Load orders when the page opens
  useEffect(() => {
    loadOrders();
  }, []);

  // Calculate order statistics
  const summaryCards = [
    {
      title: "Total Orders",
      value: orders.length,
      icon: "📦",
    },
    {
      title: "Pending Orders",
      value: orders.filter(
        (order) => order.status === "pending"
      ).length,
      icon: "⏳",
    },
    {
      title: "Shipped Orders",
      value: orders.filter(
        (order) => order.status === "shipped"
      ).length,
      icon: "💳",
    },
    {
      title: "Completed Orders",
      value: orders.filter(
        (order) => order.status === "completed"
      ).length,
      icon: "✅",
    },
  ];

  // Search and filter orders
  const filteredOrders = orders.filter((order) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      order.id.toLowerCase().includes(query) ||
      (order.user_id || "").toLowerCase().includes(query) ||
      order.order_items?.some((item) =>
        item.item_name.toLowerCase().includes(query)
      );

    const matchesStatus =
      statusFilter === "all" ||
      order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">

      {/* Return to the main administration dashboard */}
      <Link
        to="/admin"
        className="inline-block text-sm font-semibold text-[#0E3B2E] hover:underline"
      >
        ← Back to Admin Dashboard
      </Link>

      {/* Order management banner */}
      <section className="rounded-2xl bg-[#0E3B2E] p-8 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>
            <span className="text-xs font-semibold text-[#CDEBD8]">
              ADMINISTRATION
            </span>

            <h1 className="mt-3 text-3xl font-bold">
              Order Management
            </h1>

            <p className="mt-2 text-[#CDEBD8]">
              View and manage CampusConnect merchandise orders.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            disabled={loading || saving}
            className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0E3B2E] hover:bg-[#CDEBD8] disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh Orders"}
          </button>

        </div>
      </section>

      {/* Order statistics cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

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

      {/* Search and status filters */}
      <section className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <input
          type="search"
          aria-label="Search orders"
          placeholder="Search order, customer ID or product..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedOrder(null);
          }}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm"
        />

        <select
          aria-label="Filter orders by status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setSelectedOrder(null);
          }}
          className="rounded-lg border border-slate-300 px-4 py-3 text-sm"
        >
          <option value="all">All Statuses</option>

          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}

        </select>
      </section>

      {/* Display status management feedback */}
      {message && (
        <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">
          {message}
        </p>
      )}
      {actionError && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">
          {actionError}
        </p>
      )}

      {/* Loading message */}
      {loading && (
        <p
          role="status"
          className="rounded-xl bg-white p-8 text-center"
        >
          Loading orders...
        </p>
      )}

      {/* Database error handling */}
      {error && (
        <section
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-6"
        >
          <h2 className="font-bold text-amber-900">
            Order data unavailable
          </h2>

          <p className="mt-2 text-sm text-amber-800">
            Orders could not be retrieved. The order database
            may not be available yet.
          </p>

          <p className="mt-2 text-xs text-amber-800">
            {error}
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

      {/* Empty orders message */}
      {!loading && !error && filteredOrders.length === 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">

          <div className="text-5xl">📦</div>

          <h2 className="mt-4 text-xl font-bold text-[#0E3B2E]">
            No Orders Found
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            {orders.length === 0
              ? "Customer orders will appear here once they are placed."
              : "Try changing your search or status filter."}
          </p>

        </section>
      )}

      {/* Merchandise orders table */}
      {!loading && !error && filteredOrders.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <h2 className="border-b p-5 text-lg font-bold text-[#0E3B2E]">
            Merchandise Orders ({filteredOrders.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">

              <thead className="bg-[#CDEBD8]/40 text-[#0E3B2E]">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t hover:bg-slate-50"
                  >
                    <td className="p-4 font-semibold">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>

                    <td className="p-4">
                      {order.user_id
                        ? order.user_id.slice(0, 8)
                        : "Unknown"}
                    </td>

                    <td className="whitespace-nowrap p-4">
                      {new Date(order.created_at).toLocaleDateString("en-CA")}
                    </td>

                    <td className="whitespace-nowrap p-4 font-semibold">
                      {formatPrice(order.total, order.currency)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          statusColors[order.status] ||
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="p-4">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setSelectedOrder(order)}
                        className="whitespace-nowrap rounded-lg bg-[#0E3B2E] px-3 py-2 text-xs font-semibold text-white"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </section>
      )}

      {/* Individual order details */}
      {selectedOrder && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between gap-4">

            <h2 className="text-xl font-bold text-[#0E3B2E]">
              Order Details
            </h2>

            <button
              type="button"
              disabled={saving}
              onClick={() => setSelectedOrder(null)}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Close
            </button>

          </div>

          <div className="mt-4 space-y-2 break-all text-sm text-slate-600">
            <p>Order ID: {selectedOrder.id}</p>

            <p>
              Customer ID: {selectedOrder.user_id || "Unknown"}
            </p>

            <p>
              Date: {new Date(selectedOrder.created_at).toLocaleString("en-CA")}
            </p>

            <p className="capitalize">
              Status: {selectedOrder.status}
            </p>
          </div>

          {/* Manage the selected order using permitted transitions */}
          {selectedOrder.payment_provider === "demo" && (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Demonstration order — no real payment or shipment.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {((selectedOrder.status === "pending" &&
              selectedOrder.payment_provider === "demo") ||
              selectedOrder.status === "paid") && (
              <button type="button" disabled={saving}
                onClick={() => changeStatus(selectedOrder, "shipped")}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Mark as Shipped
              </button>
            )}
            {selectedOrder.status === "shipped" && (
              <button type="button" disabled={saving}
                onClick={() => changeStatus(selectedOrder, "completed")}
                className="rounded-lg bg-[#0E3B2E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Mark as Completed
              </button>
            )}
            {selectedOrder.status === "pending" && (
              <button type="button" disabled={saving}
                onClick={() => changeStatus(selectedOrder, "cancelled")}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Cancel Order
              </button>
            )}
            {saving && <p role="status">Updating order...</p>}
          </div>

          <h3 className="mb-3 mt-6 font-bold text-[#0E3B2E]">
            Order Items
          </h3>

          {selectedOrder.order_items?.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 border-b py-4"
            >
              <div>
                <p className="font-semibold">{item.item_name}</p>

                <p className="text-sm text-slate-600">
                  Quantity: {item.quantity}
                </p>

                <p className="text-sm text-slate-600">
                  Unit price:{" "}
                  {formatPrice(
                    item.unit_price,
                    selectedOrder.currency
                  )}
                </p>
              </div>

              <p className="font-bold text-[#0E3B2E]">
                {formatPrice(
                  item.unit_price * item.quantity,
                  selectedOrder.currency
                )}
              </p>
            </div>
          ))}

          <div className="mt-5 flex justify-between text-sm">
            <span>Subtotal</span>

            <span>
              {formatPrice(
                selectedOrder.subtotal,
                selectedOrder.currency
              )}
            </span>
          </div>

          <div className="mt-3 flex justify-between text-lg font-bold text-[#0E3B2E]">
            <span>Order Total</span>

            <span>
              {formatPrice(
                selectedOrder.total,
                selectedOrder.currency
              )}
            </span>
          </div>

        </section>
      )}

    </div>
  );
}