
import { Link } from "react-router-dom";
import { useCart } from "../store/cart";

// CampusConnect - Sprint 3
// Subtask: Shopping Cart page
// Author: Omar
//
// Displays merchandise added to the cart.
// Uses the existing Zustand cart store.
// Does not modify Supabase or process payments.

const productEmoji = (name) => {
  if (name === "CampusConnect Hoodie") return "🧥";
  if (name === "CampusConnect T-Shirt") return "👕";
  if (name === "CampusConnect Water Bottle") return "🥤";
  return "🛍️";
};

export default function Cart() {
  // Step 1: Read cart items and actions from Zustand.
  const items = useCart((state) => state.items);
  const remove = useCart((state) => state.remove);
  const clear = useCart((state) => state.clear);

  // Step 2: Calculate total quantity and subtotal.
  const totalQuantity = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = items.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );

  return (
    <div className="mx-auto max-w-4xl">
      {/* Page heading */}
      <h1 className="text-3xl font-bold text-emerald-950">
        Shopping Cart
      </h1>

      <p className="mt-2 text-slate-600">
        Review your CampusConnect merchandise.
      </p>

      {/* Step 3: Show a message when the cart is empty. */}
      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mb-4 text-6xl">🛒</div>

          <h2 className="text-xl font-bold text-emerald-950">
            Your shopping cart is empty.
          </h2>

          <p className="mt-2 text-slate-500">
            Explore our campus merchandise and add your
            favorite products.
          </p>

          <Link
            to="/store"
            className="mt-6 inline-block rounded-lg bg-emerald-900 px-6 py-3 font-semibold text-white hover:bg-emerald-800"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {/* Step 4: Display products in the cart. */}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              {/* Product picture */}
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-5xl">
                {productEmoji(item.name)}
              </div>

              {/* Product information */}
              <div className="min-w-0 flex-1">
                <Link
                  to={`/store/${item.id}`}
                  className="text-lg font-bold text-emerald-950 hover:underline"
                >
                  {item.name}
                </Link>

                <p className="mt-1 text-sm text-slate-500">
                  Unit Price: ${Number(item.price).toFixed(2)}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Quantity: {item.quantity}
                </p>

                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="mt-3 text-sm font-medium text-red-600 hover:underline"
                >
                  Remove Product
                </button>
              </div>

              {/* Product subtotal */}
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-900">
                  ${(Number(item.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}

          {/* Step 5: Display cart summary. */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-emerald-950">
              Order Summary
            </h2>

            <div className="mt-4 flex justify-between text-slate-600">
              <span>Total Items</span>
              <span>{totalQuantity}</span>
            </div>

            <div className="mt-3 flex justify-between border-t pt-4 text-xl font-bold text-emerald-950">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Taxes, shipping, and checkout are not yet
              implemented.
            </p>

            {/* Step 6: Cart action buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/store"
                className="rounded-lg bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Continue Shopping
              </Link>

              <button
                type="button"
                onClick={clear}
                className="rounded-lg border border-red-300 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
