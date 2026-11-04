"use client";

import { useState, type FormEvent } from "react";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  inventory: number;
  active: boolean;
};

const blank = { name: "", description: "", price: "", imageUrl: "", inventory: "0" };

export default function AdminProducts({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch(editingId ? `/api/products/${editingId}` : "/api/products", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Math.round(Number(form.price) * 100), inventory: Number(form.inventory) })
    });
    const result = await response.json();
    if (!response.ok) setError(result.error || "Unable to create product.");
    else {
      setProducts((current) => editingId
        ? current.map((item) => item.id === editingId ? result.product : item)
        : [result.product, ...current]);
      setForm(blank);
      setEditingId(null);
    }
    setBusy(false);
  }

  function edit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: (product.price / 100).toFixed(2),
      imageUrl: product.imageUrl ?? "",
      inventory: String(product.inventory)
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(blank);
    setError("");
  }

  async function toggleActive(product: Product) {
    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !product.active })
    });
    const result = await response.json();
    if (!response.ok) return setError(result.error || "Unable to update product.");
    setProducts((current) => current.map((item) => item.id === product.id ? result.product : item));
  }

  async function remove(product: Product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) return setError(result.error || "Unable to delete product.");
    setProducts((current) => current.filter((item) => item.id !== product.id));
  }

  return (
    <section className="content-page">
      <p className="eyebrow">STORE MANAGEMENT</p><h1>Products</h1>
      <div className="admin-layout">
        <form className="form-card" onSubmit={submit}>
          <h2>{editingId ? "Edit product" : "Add a product"}</h2>
          <label>Name<input required minLength={2} maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Description<textarea required maxLength={2000} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="form-row">
            <label>Price (USD)<input type="number" min="0.01" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
            <label>Stock<input type="number" min="0" max="100000" step="1" required value={form.inventory} onChange={(e) => setForm({ ...form, inventory: e.target.value })} /></label>
          </div>
          <label>Image URL (optional)<input type="url" maxLength={2000} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></label>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="button button-dark" disabled={busy}>{busy ? "Saving..." : editingId ? "Save changes" : "Add product"}</button>
          {editingId && <button className="text-button" type="button" onClick={cancelEdit}>Cancel editing</button>}
        </form>
        <div className="admin-product-list">
          {products.map((product) => (
            <article className="admin-product" key={product.id}>
              <div><h3>{product.name}</h3><p className="muted">${(product.price / 100).toFixed(2)} · {product.inventory} in stock · {product.active ? "Live" : "Hidden"}</p></div>
              <div className="admin-actions">
                <button className="text-button" onClick={() => edit(product)}>Edit</button>
                <button className="text-button" onClick={() => toggleActive(product)}>{product.active ? "Hide" : "Publish"}</button>
                <button className="text-button danger-text" onClick={() => remove(product)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
