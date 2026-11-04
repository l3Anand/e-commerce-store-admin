"use client";

import { useState } from "react";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  inventory: number;
};

export default function Storefront({ products, signedIn }: { products: Product[]; signedIn: boolean }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  function addToCart(product: Product) {
    setCart((current) => ({ ...current, [product.id]: Math.min((current[product.id] ?? 0) + 1, product.inventory) }));
    setMessage(`${product.name} added to your bag.`);
  }

  async function checkout() {
    if (!signedIn) {
      window.location.href = "/login";
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: Object.entries(cart).map(([productId, quantity]) => ({ productId, quantity })) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to start checkout.");
      window.location.href = result.url;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start checkout.");
      setBusy(false);
    }
  }

  return (
    <div>
      <section className="hero">
        <p className="eyebrow">THE EVERYDAY EDIT</p>
        <h1>Good things,<br />made to last.</h1>
        <p>Well-made essentials for the little rituals that make a day.</p>
        <a className="button button-light" href="#collection">Explore the collection</a>
        <span className="hero-mark" aria-hidden="true">N.</span>
      </section>
      <section id="collection" className="collection">
        <div className="section-heading">
          <div><p className="eyebrow">CURATED FOR YOU</p><h2>The collection</h2></div>
          <p>{cartCount} {cartCount === 1 ? "item" : "items"} in your bag</p>
        </div>
        {products.length === 0 ? <p className="empty-state">The collection is being prepared. Check back soon.</p> : (
          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image">
                  {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span>NS</span>}
                </div>
                <div className="product-details">
                  <div className="product-title"><h3>{product.name}</h3><span>${(product.price / 100).toFixed(2)}</span></div>
                  <p>{product.description}</p>
                  <button className="button button-outline" disabled={product.inventory < 1} onClick={() => addToCart(product)}>
                    {product.inventory > 0 ? `Add to bag${cart[product.id] ? ` (${cart[product.id]})` : ""}` : "Sold out"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        {cartCount > 0 && <div className="cart-bar"><p>{cartCount} {cartCount === 1 ? "item" : "items"} ready when you are.</p><button className="button button-dark" onClick={checkout} disabled={busy}>{busy ? "Connecting to checkout..." : "Checkout securely"}</button></div>}
        {message && <p className="form-message" role="status">{message}</p>}
      </section>
    </div>
  );
}
