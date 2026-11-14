import Link from "next/link";
import { product } from "@/config/product";

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">{product.track}</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{product.tagline}</h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">{product.subtitle}</p>
        <Link
          href="/tool"
          className="mt-6 inline-block rounded-lg bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark"
        >
          Try it now. No sign-up.
        </Link>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Why it matters</h2>
        <ul className="mt-3 space-y-2 text-slate-700">
          {product.pains.map((p) => (
            <li key={p} className="rounded-lg border bg-white p-3">
              {p}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">How it works</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {product.steps.map((s, i) => (
            <div key={s.title} className="rounded-lg border bg-white p-4">
              <div className="text-sm text-brand">Step {i + 1}</div>
              <div className="font-semibold">{s.title}</div>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-brand-light p-6 text-center">
        <h2 className="text-xl font-semibold">Pricing</h2>
        <p className="mt-2 text-slate-700">
          First {product.pricing.freeUses} checks free. Full report: <strong>{product.pricing.priceLabel}</strong>{" "}
          {product.pricing.priceNote}.
        </p>
      </section>
    </div>
  );
}
