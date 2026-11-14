"use client";

import { product } from "@/config/product";
import { setPro, track } from "@/lib/client";

export default function Paywall({ onUnlock }: { onUnlock: () => void }) {
  const link = process.env.NEXT_PUBLIC_PAYMENT_LINK;

  return (
    <section className="rounded-2xl border-2 border-brand bg-white p-6 text-center shadow-sm">
      <h3 className="text-lg font-semibold">{product.pricing.cta}</h3>
      <p className="mt-1 text-slate-600">
        <strong>{product.pricing.priceLabel}</strong> {product.pricing.priceNote}
      </p>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("paywall_click_payment_link")}
          className="mt-4 inline-block rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark"
        >
          {product.pricing.cta}
        </a>
      ) : (
        <button
          onClick={() => {
            // DEMO unlock (no real payment configured). Set NEXT_PUBLIC_PAYMENT_LINK for Stripe test mode.
            track("paywall_demo_unlock");
            setPro();
            onUnlock();
          }}
          className="mt-4 rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark"
        >
          {product.pricing.cta} (demo)
        </button>
      )}
      <p className="mt-3 text-xs text-slate-400">Stripe test mode. No real charge in the hackathon demo.</p>
    </section>
  );
}
