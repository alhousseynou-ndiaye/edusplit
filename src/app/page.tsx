import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border px-3 py-1 text-sm font-medium">
            EduSplit
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Finance your laptop in installments, move your future forward.
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            EduSplit helps students, apprentices, and young professionals access
            productive digital equipment through structured installment plans.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/apply"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Apply now
            </Link>

            <a
              href="#how-it-works"
              className="rounded-xl border px-5 py-3 text-sm font-semibold hover:bg-slate-50"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-2xl font-bold">How it works</h2>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border p-6">
            <h3 className="font-semibold">1. Submit your application</h3>
            <p className="mt-2 text-sm text-slate-600">
              Tell us about yourself, the laptop you need, your down payment,
              and your guarantor.
            </p>
          </div>

          <div className="rounded-2xl border p-6">
            <h3 className="font-semibold">2. We review your profile</h3>
            <p className="mt-2 text-sm text-slate-600">
              We check your documents, your guarantor, and the affordability of
              your request.
            </p>
          </div>

          <div className="rounded-2xl border p-6">
            <h3 className="font-semibold">3. Pay over time</h3>
            <p className="mt-2 text-sm text-slate-600">
              Once approved, you pay your down payment first and the remaining
              balance over a short installment plan.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}