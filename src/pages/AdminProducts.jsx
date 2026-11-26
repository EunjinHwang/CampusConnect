import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

// CampusConnect - Sprint 5
// Merchandise Management
// Provides product management for administrators.

const emptyForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
  image_url: "",
  is_active: true,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  // Load all products, including inactive merchandise.
  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, description, price, stock, image_url, is_active"
        )
        .order("name", { ascending: true });

      if (error) throw error;

      setProducts(data ?? []);
    } catch (err) {
      setError(err.message || "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  // Handle changes to product form fields.
  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
    setMessage("");
  }

  // Validate product information before saving.
  function validateForm() {
    if (!form.name.trim()) {
      return "Product name is required.";
    }

    if (!form.description.trim()) {
      return "Product description is required.";
    }

    if (
      String(form.price).trim() === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) <= 0 ||
      Number(form.price) > 99999999.99
    ) {
      return "Please enter a valid product price.";
    }

    if (
      String(form.stock).trim() === "" ||
      !Number.isInteger(Number(form.stock)) ||
      Number(form.stock) < 0 ||
      Number(form.stock) > 2147483647
    ) {
      return "Stock must be a non-negative whole number.";
    }

    if (form.image_url.trim()) {
      try {
        const url = new URL(form.image_url.trim());

        if (!["http:", "https:"].includes(url.protocol)) {
          return "Please enter a valid image URL.";
        }
      } catch {
        return "Please enter a valid image URL.";
      }
    }

    return "";
  }

  // Create a product or save changes to an existing product.
  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    const productData = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingId)
          .select("id")
          .single();

        if (error) throw error;

        setMessage("Product updated successfully.");
      } else {
        const { error } = await supabase
          .from("products")
          .insert(productData)
          .select("id")
          .single();

        if (error) throw error;

        setMessage("Product created successfully.");
      }

      setForm({ ...emptyForm });
      setEditingId(null);

      await loadProducts();
    } catch (err) {
      setError(err.message || "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  // Populate the form with the selected product.
  function handleEdit(product) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      stock: product.stock,
      image_url: product.image_url || "",
      is_active: product.is_active,
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Reset the form and return to product creation.
  function handleCancel() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setMessage("");
  }

  // Activate or deactivate a product without deleting it.
  async function handleToggleStatus(product) {
    const action = product.is_active
      ? "deactivate"
      : "activate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${product.name}?`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const { error } = await supabase
        .from("products")
        .update({
          is_active: !product.is_active,
        })
        .eq("id", product.id)
        .select("id")
        .single();

      if (error) throw error;

      if (editingId === product.id) {
        handleCancel();
      }

      setMessage(
        product.is_active
          ? "Product deactivated successfully."
          : "Product activated successfully."
      );

      await loadProducts();
    } catch (err) {
      setError(
        err.message || "Unable to change product status."
      );
    } finally {
      setSaving(false);
    }
  }

  // Calculate merchandise dashboard statistics.
  const activeProducts = products.filter(
    (product) => product.is_active
  ).length;

  const outOfStock = products.filter(
    (product) => product.stock === 0
  ).length;

  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0
  );

  // Filter products using the search field.
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  const inputClass =
    "mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100";

  return (
    <div className="space-y-8">

      {/* Navigation */}
      <Link
        to="/admin"
        className="text-sm font-semibold text-emerald-800 hover:underline"
      >
        ← Back to Admin Dashboard
      </Link>

      {/* Page heading */}
      <section className="rounded-2xl bg-[#0E3B2E] p-8 text-white shadow-md">
        <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold">
          ADMINISTRATION
        </span>

        <h1 className="mt-5 text-3xl font-bold">
          Merchandise Management
        </h1>

        <p className="mt-3 text-[#CDEBD8]">
          Manage campus merchandise, prices, availability
          and inventory.
        </p>
      </section>

      {/* Merchandise statistics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Total Products", products.length, "📦"],
          ["Active Products", activeProducts, "🛍️"],
          ["Out of Stock", outOfStock, "⚠️"],
          ["Total Inventory", totalStock, "📊"],
        ].map(([title, value, icon]) => (
          <div
            key={title}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <span className="text-2xl">{icon}</span>

            <p className="mt-3 text-sm text-slate-600">
              {title}
            </p>

            <p className="mt-1 text-3xl font-bold text-[#0E3B2E]">
              {loading ? "—" : value}
            </p>
          </div>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Success message */}
      {message && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          ✓ {message}
        </div>
      )}

      {/* Product management form */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#0E3B2E]">
          {editingId ? "Edit Product" : "Add New Product"}
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Enter the merchandise information below.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 space-y-5"
        >
          <fieldset disabled={saving} className="space-y-5">

            <div>
              <label
                htmlFor="name"
                className="text-sm font-semibold"
              >
                Product Name *
              </label>

              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter product name"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="text-sm font-semibold"
              >
                Description *
              </label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter product description"
                rows={4}
                className={inputClass}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="price"
                  className="text-sm font-semibold"
                >
                  Price ($) *
                </label>

                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="stock"
                  className="text-sm font-semibold"
                >
                  Stock Quantity *
                </label>

                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="image_url"
                className="text-sm font-semibold"
              >
                Product Image URL
              </label>

              <input
                id="image_url"
                name="image_url"
                type="url"
                value={form.image_url}
                onChange={handleChange}
                placeholder="https://example.com/product.jpg"
                className={inputClass}
              />
            </div>

            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="h-5 w-5 accent-emerald-800"
              />

              Display product in the merchandise store
            </label>

            {/* Form action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#0E3B2E] px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Add Product"}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                {editingId ? "Cancel Edit" : "Clear Form"}
              </button>
            </div>

          </fieldset>
        </form>
      </section>

      {/* Product inventory */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-[#0E3B2E]">
            Product Inventory
          </h2>

          <button
            type="button"
            onClick={loadProducts}
            disabled={loading || saving}
            className="rounded-lg border border-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-50"
          >
            Refresh Products
          </button>
        </div>

        {/* Search products */}
        <input
          type="search"
          aria-label="Search products"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products..."
          className={inputClass}
        />

        {loading ? (
          <p className="py-10 text-center text-slate-500">
            Loading merchandise...
          </p>
        ) : filteredProducts.length === 0 ? (
          <p className="py-10 text-center text-slate-500">
            No products to display.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">

              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-slate-100"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">

                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-2xl">
                            🛍️
                          </div>
                        )}

                        <span className="font-semibold text-[#0E3B2E]">
                          {product.name}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      ${Number(product.price).toFixed(2)}
                    </td>

                    <td className="p-4">
                      <span
                        className={
                          product.stock === 0
                            ? "font-semibold text-red-600"
                            : "text-slate-700"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {product.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleEdit(product)}
                          className="rounded-lg bg-emerald-50 px-3 py-2 font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            handleToggleStatus(product)
                          }
                          className={`rounded-lg px-3 py-2 font-medium disabled:opacity-50 ${
                            product.is_active
                              ? "bg-red-50 text-red-700 hover:bg-red-100"
                              : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          }`}
                        >
                          {product.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </section>
    </div>
  );
}