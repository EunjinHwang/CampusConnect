import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../store/cart";
import { validateCart } from "../lib/checkoutValidation";
import { supabase } from "../lib/supabase";
import "./Checkout.css";
// CampusConnect - Sprint 5
// Animated checkout and simulated payment.
// Provides secure order placement and error handling.
export default function Checkout() {
  const items = useCart((state) => state.items);
  const clear = useCart((state) => state.clear);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderId, setOrderId] = useState("");
  // Prevent repeated submissions during checkout.
  const submitting = useRef(false);
  // Calculate the merchandise subtotal.
  const subtotal = items.reduce(
    (total, item) =>
      total + Number(item.price) * item.quantity,
    0
  );
  // Format the card number into groups of four digits.
  function handleCardNumber(value) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    setCardNumber(
      digits.replace(/(.{4})/g, "$1 ").trim()
    );
    setFlipped(false);
  }
  // Format the expiration date as MM/YY.
  function handleExpiry(value) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setExpiry(
      digits.length > 2
        ? `${digits.slice(0, 2)}/${digits.slice(2)}`
        : digits
    );
    setFlipped(false);
  }
  // Display the back of the card while entering CVC.
  function handleCvc(value) {
    setCvc(value.replace(/\D/g, "").slice(0, 3));
    setFlipped(true);
  }
  // Validate the demonstration payment form.
  function validatePayment() {
    const messages = [];
    if (!cardName.trim()) {
      messages.push("Cardholder name is required.");
    }
    if (
      cardNumber.replace(/\s/g, "") !==
      "4242424242424242"
    ) {
      messages.push(
        "Use the demo card number 4242 4242 4242 4242."
      );
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      messages.push("Enter a valid expiry date (MM/YY).");
    } else {
      const [month, year] = expiry.split("/").map(Number);
      const now = new Date();
      const fullYear = 2000 + year;
      if (month < 1 || month > 12) {
        messages.push("Invalid expiration month.");
      } else if (
        fullYear < now.getFullYear() ||
        (fullYear === now.getFullYear() &&
          month < now.getMonth() + 1)
      ) {
        messages.push("The card has expired.");
      }
    }
    if (!/^\d{3}$/.test(cvc)) {
      messages.push("CVC must contain three digits.");
    }
    return messages;
  }
  // Validate the cart and create a demonstration order.
  async function handlePayment(event) {
    event.preventDefault();
    if (submitting.current) return;
    setErrors([]);
    setFlipped(false);
    const validationErrors = validatePayment();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    submitting.current = true;
    setProcessing(true);
    try {
      // Verify the authenticated customer.
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        setErrors([
          "Please sign in before placing your order.",
        ]);
        return;
      }
      // Verify current product availability and prices.
      const result = await validateCart(items);
      if (!result.valid) {
        setErrors(result.errors);
        return;
      }
      // Prevent confirmation if the cart changes.
      if (useCart.getState().items !== items) {
        setErrors([
          "Your cart has changed. Please try again.",
        ]);
        return;
      }
      // Prepare merchandise data for the database.
      const orderItems = items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        expected_price: Number(item.price),
      }));
      // Create the order using the secure database function.
      // Payment card information is never sent to Supabase.
      const { data, error } = await supabase.rpc(
        "checkout",
        {
          p_items: orderItems,
        }
      );
      // Display database errors without clearing the cart.
      if (error) {
        const message = error.message || "";
        if (
          message.includes("Not enough stock") ||
          message.includes("has changed") ||
          message.includes("unavailable") ||
          message.includes("Invalid product quantity") ||
          message.includes("Duplicate product")
        ) {
          setErrors([message]);
        } else {
          setErrors([
            "Unable to confirm your order. Check whether it was created before trying again.",
          ]);
        }
        return;
      }
      // Verify that the database returned an order ID.
      if (!data) {
        setErrors([
          "Order confirmation was not received. Please verify your order before trying again.",
        ]);
        return;
      }
      // Save the order confirmation details.
      setOrderId(data);
      setOrderTotal(subtotal);
      // Clear demonstration payment information.
      setCardName("");
      setCardNumber("");
      setExpiry("");
      setCvc("");
      // Clear the purchased cart after successful placement.
      // Preserve the cart if it changed during the request.
      if (useCart.getState().items === items) {
        clear();
      }
      setSuccess(true);
    } catch {
      setErrors([
        "Unable to confirm checkout. Please verify whether your order was created before trying again.",
      ]);
    } finally {
      submitting.current = false;
      setProcessing(false);
    }
  }
  // Display the order confirmation.
  if (success) {
    return (
      <div className="checkout-success">
        <div className="success-circle">✓</div>
        <h1>Order Placed Successfully!</h1>
        <p>
          Thank you for shopping with CampusConnect.
        </p>
        <div className="success-amount">
          ${orderTotal.toFixed(2)} CAD
        </div>
        {/* Display the order confirmation number */}
        <div className="my-4 rounded-xl bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            Order Confirmation Number
          </p>
          <p className="mt-2 break-all font-mono text-sm">
            {orderId}
          </p>
          <div className="mt-3">
            <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800">
              Status: Pending
            </span>
          </div>
        </div>
        <p className="demo-notice">
          Your demonstration order has been created.
          No real money was charged.
        </p>
        {/* Navigate to order history or continue shopping */}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/my-orders" className="checkout-button">
            View My Orders
          </Link>
          <Link
            to="/store"
            className="rounded-lg border border-[#0E3B2E] px-6 py-3 font-semibold text-[#0E3B2E] hover:bg-emerald-50"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }
  // Prevent checkout when the shopping cart is empty.
  if (items.length === 0) {
    return (
      <div className="checkout-success">
        <div className="text-6xl">🛒</div>
        <h1>Your Shopping Cart Is Empty</h1>
        <p>Add merchandise before checking out.</p>
        <Link to="/store" className="checkout-button">
          Browse Merchandise
        </Link>
      </div>
    );
  }
  return (
    <div className="checkout-page">
      {!processing && (
        <Link
          to="/cart"
          className="text-sm font-semibold text-emerald-800"
        >
          ← Back to Shopping Cart
        </Link>
      )}
      {/* Checkout heading */}
      <div className="checkout-heading">
        <h1>Secure Checkout</h1>
        <p>
          Review your order and enter demo payment details.
        </p>
      </div>
      <div className="checkout-grid">
        {/* Payment section */}
        <section className="checkout-panel">
          <h2>Payment Details</h2>
          <p className="demo-notice">
            Demonstration only. Do not enter real card details.
            Use 4242 4242 4242 4242 with a fictional name,
            future expiry date and demo CVC.
          </p>
          {/* Animated payment card */}
          <div className="payment-card-container">
            <div
              className={`payment-card ${
                flipped ? "flipped" : ""
              }`}
            >
              {/* Front of payment card */}
              <div className="card-face card-front">
                <div className="card-brand">
                  CampusConnect
                </div>
                <div className="card-chip"></div>
                <div className="card-number">
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>
                <div className="card-bottom">
                  <div>
                    <small>CARDHOLDER</small>
                    <div>
                      {cardName.toUpperCase() || "YOUR NAME"}
                    </div>
                  </div>
                  <div>
                    <small>EXPIRES</small>
                    <div>{expiry || "MM/YY"}</div>
                  </div>
                </div>
                <div className="card-visa">VISA</div>
              </div>
              {/* Back of payment card */}
              <div className="card-face card-back">
                <div className="magnetic-strip"></div>
                <div className="signature-label">
                  AUTHORIZED SIGNATURE
                </div>
                <div className="signature-strip">
                  <span>
                    {cvc ? "•".repeat(cvc.length) : "•••"}
                  </span>
                </div>
                <div className="card-back-text">
                  CampusConnect Demo Payment Card
                </div>
                <div className="card-visa">VISA</div>
              </div>
            </div>
          </div>
          {/* Payment form */}
          <form
            onSubmit={handlePayment}
            noValidate
            className="payment-form"
          >
            <fieldset disabled={processing}>
              <label htmlFor="cardName">
                Cardholder Name
              </label>
              <input
                id="cardName"
                value={cardName}
                placeholder="Alex Student"
                maxLength={40}
                autoComplete="off"
                onFocus={() => setFlipped(false)}
                onChange={(event) =>
                  setCardName(event.target.value)
                }
              />
              <label htmlFor="cardNumber">
                Card Number
              </label>
              <input
                id="cardNumber"
                value={cardNumber}
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                autoComplete="off"
                onFocus={() => setFlipped(false)}
                onChange={(event) =>
                  handleCardNumber(event.target.value)
                }
              />
              <div className="payment-form-row">
                <div>
                  <label htmlFor="expiry">
                    Expiration Date
                  </label>
                  <input
                    id="expiry"
                    value={expiry}
                    placeholder="MM/YY"
                    inputMode="numeric"
                    autoComplete="off"
                    onFocus={() => setFlipped(false)}
                    onChange={(event) =>
                      handleExpiry(event.target.value)
                    }
                  />
                </div>
                <div>
                  <label htmlFor="cvc">
                    CVC
                  </label>
                  <input
                    id="cvc"
                    type="password"
                    value={cvc}
                    placeholder="123"
                    inputMode="numeric"
                    autoComplete="off"
                    onFocus={() => setFlipped(true)}
                    onBlur={() => setFlipped(false)}
                    onChange={(event) =>
                      handleCvc(event.target.value)
                    }
                  />
                </div>
              </div>
              {/* Payment and order validation errors */}
              {errors.length > 0 && (
                <div role="alert" className="payment-errors">
                  <strong>
                    Unable to complete checkout.
                  </strong>
                  <ul>
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Order placement action */}
              <button
                type="submit"
                className="checkout-button"
                disabled={processing}
              >
                {processing
                  ? "Processing Your Order..."
                  : `🔒 Demo Pay $${subtotal.toFixed(2)}`}
              </button>
            </fieldset>
          </form>
        </section>
        {/* Order summary */}
        <aside className="checkout-panel order-summary">
          <h2>Order Summary</h2>
          {items.map((item) => (
            <div key={item.id} className="checkout-item">
              <div>
                <strong>{item.name}</strong>
                <p>Quantity: {item.quantity}</p>
              </div>
              <strong>
                ${(Number(item.price) * item.quantity).toFixed(2)}
              </strong>
            </div>
          ))}
          <div className="checkout-total">
            <span>Subtotal</span>
            <strong>${subtotal.toFixed(2)} CAD</strong>
          </div>
          <p className="demo-notice">
            Taxes and shipping are not included in this demo.
          </p>
          <div className="payment-security">
            🔒 Simulated Payment
          </div>
        </aside>
      </div>
    </div>
  );
}