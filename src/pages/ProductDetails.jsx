
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../store/cart";
import { getProductById } from "../lib/products";

// CampusConnect - Sprint 3
// Subtask: Create merchandise product detail views
// Author: Omar
//
// Loads product details from Supabase and connects
// merchandise to the existing Zustand shopping cart.

export default function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  const addToCart = useCart((state) => state.add);

  // Step 1: Load the selected product from Supabase.
  useEffect(() => {
    let active = true;

    async function loadProduct() {
      setLoading(true);
      setError("");
      setProduct(null);
      setQuantity(1);
      setMessage("");

      try {
        const data = await getProductById(id);

        if (active) {
          setProduct(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load product.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [id]);

  // Step 2: Add selected quantity to the existing cart.
  function handleAddToCart() {
    if (!product) return;

    const selectedQuantity = Number(quantity);

    if (
      !Number.isInteger(selectedQuantity) ||
      selectedQuantity < 1
    ) {
      setMessage("Please select a valid quantity.");
      return;
    }

    const existingQuantity =
      useCart
        .getState()
        .items.find((item) => item.id === product.id)
        ?.quantity ?? 0;

    // Prevent adding more than the available stock.
    if (existingQuantity + selectedQuantity > product.stock) {
      setMessage("Not enough stock available.");
      return;
    }

    const cartProduct = {
      id: product.id,
      name: product.name,
      price: Number(product.price),
    };

    // Reuse the existing Zustand add function.
    for (let i = 0; i < selectedQuantity; i++) {
      addToCart(cartProduct);
    }

    setMessage(`${selectedQuantity} item(s) added to your cart!`);
  }

  // Step 3: Loading state.
  if (loading) {
    return (
      <p className="text-slate-600">
        Loading product details...
      </p>
    );
  }

  // Step 4: Error state.
  if (error) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-emerald-950">
          Product Details
        </h1>

        <p role="alert" className="mt-4 text-red-600">
          Could not load product: {error}
        </p>

        <Link
          to="/store"
          className="mt-4 inline-block text-emerald-800"
        >
          Back to Store
        </Link>
      </section>
    );
  }

  // Step 5: Product not found.
  if (!product) {
    return (
      <section className="py-12 text-center">
        <h1 className="text-2xl font-bold">
          Product Not Found
        </h1>

        <Link
          to="/store"
          className="mt-4 inline-block text-emerald-800"
        >
          Back to Store
        </Link>
      </section>
    );
  }

  return (
    <section>
      <Link
        to="/store"
        className="mb-6 inline-block text-sm text-emerald-800 hover:underline"
      >
        ← Back to Store
      </Link>

      <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">

        {/* Step 6: Product image */}
        <div className="flex min-h-80 items-center justify-center bg-emerald-50">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-8xl" aria-hidden="true">
              🛍️
            </span>
          )}
        </div>

        {/* Step 7: Product information */}
        <div className="p-8">
          <h1 className="text-3xl font-bold text-emerald-950">
            {product.name}
          </h1>

          <p className="mt-4 text-2xl font-bold text-emerald-900">
            ${Number(product.price).toFixed(2)}
          </p>

          <p className="mt-5 text-slate-600">
            {product.description || "Campus merchandise product."}
          </p>

          <p className="mt-4 text-sm font-medium text-slate-700">
            Available stock: {product.stock}
          </p>

          {/* Step 8: Quantity selection */}
          <div className="mt-6">
            <label
              htmlFor="quantity"
              className="mb-2 block text-sm font-semibold"
            >
              Quantity
            </label>

            <input
              id="quantity"
              type="number"
              min="1"
              max={Math.max(1, product.stock)}
              value={quantity}
              disabled={product.stock === 0}
              onChange={(event) => {
                const value = Number(event.target.value);

                setQuantity(
                  Math.max(
                    1,
                    Math.min(product.stock || 1, value || 1)
                  )
                );

                setMessage("");
              }}
              className="w-24 rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          {/* Step 9: Add to Cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="mt-6 w-full rounded-lg bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {product.stock === 0
              ? "Out of Stock"
              : "Add to Cart"}
          </button>

          {message && (
            <p role="status" className="mt-3 text-sm font-medium text-emerald-800">
              {message}
            </p>
          )}

          <Link
            to="/cart"
            className="mt-4 block text-center text-sm text-emerald-800 hover:underline"
          >
            View Shopping Cart
          </Link>
        </div>
      </div>
    </section>
  );
}
