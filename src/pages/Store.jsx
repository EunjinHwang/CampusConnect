
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../lib/products";

// CampusConnect - Sprint 3
// Subtask: Create merchandise product detail views
// Author: Omar
//
// Displays active merchandise products from Supabase.

export default function Store() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Step 1: Load products from Supabase.
  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const data = await getProducts();

        if (active) {
          setProducts(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load merchandise.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  // Step 2: Display loading and error messages.
  if (loading) {
    return <p className="text-slate-600">Loading merchandise...</p>;
  }

  if (error) {
    return (
      <section>
        <h1 className="text-2xl font-bold text-emerald-950">
          Campus Merchandise
        </h1>
        <p role="alert" className="mt-4 text-red-600">
          Could not load merchandise: {error}
        </p>
      </section>
    );
  }

  return (
    <section>
      {/* Step 3: Store heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-950">
          Campus Merchandise
        </h1>
        <p className="mt-2 text-slate-600">
          Explore merchandise for the CampusConnect community.
        </p>
      </div>

      {/* Step 4: Display products or an empty message */}
      {products.length === 0 ? (
        <p className="rounded-lg border bg-white p-6 text-slate-600">
          No merchandise products are available yet.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              {/* Product image */}
              <div className="flex h-44 items-center justify-center bg-emerald-50">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-5xl" aria-hidden="true">
  {product.name === "CampusConnect Hoodie"
    ? "🧥"
    : product.name === "CampusConnect T-Shirt"
    ? "👕"
    : product.name === "CampusConnect Water Bottle"
    ? "🥤"
    : "🛍️"}
</span>
                )}
              </div>

              <div className="p-5">
                <h2 className="text-lg font-bold text-slate-900">
                  {product.name}
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  {product.description || "Campus merchandise product."}
                </p>

                <p className="mt-3 text-xl font-bold text-emerald-900">
                  ${Number(product.price).toFixed(2)}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {product.stock} available
                </p>

                {/* Open the selected product details */}
                <Link
                  to={`/store/${product.id}`}
                  className="mt-4 block rounded-lg bg-emerald-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  View Details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
