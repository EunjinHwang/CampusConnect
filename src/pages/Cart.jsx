import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../store/cart";
import { validateCart } from "../lib/checkoutValidation";

// CampusConnect - Sprint 3 and Sprint 5
// Subtasks: Shopping Cart, Validation and Error Handling
// Author: Omar

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

  // Navigate to the checkout page.
  const navigate = useNavigate();

  // Step 2: Manage cart validation states.
  const [validating, setValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Step 3: Calculate total quantity and subtotal.
  const totalQuantity = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = items.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );

  // Reset validation messages when cart contents change.
  function resetValidation() {
    setValidationErrors([]);
  }

  // Remove a product and reset the validation result.
  function handleRemove(id) {
    remove(id);
    resetValidation();
  }

  // Clear the cart and reset the validation result.
  function handleClear() {
    clear();
    resetValidation();
  }

  // Step 4: Validate cart products before checkout.
  async function handleCheckout() {
    if (validating) return;

    setValidating(true);
    resetValidation();

    try {
      const result = await validateCart(items);

      // Ignore results if cart contents changed during validation.
      if (useCart.getState().items !== items) {
        setValidationErrors([
          "Your cart has changed. Please try again.",
        ]);
        return;
      }

      // Navigate to checkout when validation succeeds.
      if (result.valid) {
        navigate("/checkout");
      } else {
        setValidationErrors(result.errors);
      }
    } catch (error) {
      setValidationErrors([
        "Unable to validate your cart. Please try again.",
      ]);
    } finally {
      setValidating(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Page heading */}
      <h1 className="text-3xl font-bold text-emerald-950">
        Shopping Cart
      </h1>

      <p className="mt-2 text-slate-600">
        Review your CampusConnect merchandise.
      </p>

      {/* Step 5: Display the empty cart message. */}
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
          {/* Step 6: Display products in the cart. */}
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
                  onClick={() => handleRemove(item.id)}
                  disabled={validating}
                  className="mt-3 text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
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

          {/* Step 7: Display cart summary. */}
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
              Product availability and prices will be
              verified before checkout.
            </p>

            {/* Step 8: Display validation errors. */}
            {validationErrors.length > 0 && (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4"
              >
                <h3 className="font-semibold text-red-800">
                  Cart Validation Failed
                </h3>

                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Step 9: Cart action buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={validating}
                className="rounded-lg bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {validating
                  ? "Validating..."
                  : "Proceed to Checkout →"}
              </button>

              <Link
                to="/store"
                className="rounded-lg border border-emerald-900 px-5 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
              >
                Continue Shopping
              </Link>

              <button
                type="button"
                onClick={handleClear}
                disabled={validating}
                className="rounded-lg border border-red-300 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
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