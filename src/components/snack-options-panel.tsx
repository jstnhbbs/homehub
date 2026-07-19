import { saveSnackOptions } from "@/app/actions";
import { parseSnackOptions } from "@/lib/meals/snacks";

export function SnackOptionsPanel({
  snackOptions,
  readOnly = false,
}: {
  snackOptions: string;
  readOnly?: boolean;
}) {
  const items = parseSnackOptions(snackOptions);

  return (
    <section className="hub-card p-5 max-md:p-4">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--muted)]">
          This week
        </p>
        <h2 className="font-display mt-1 text-2xl font-semibold">Snack options</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Keep a running list of snacks the family can grab anytime.
        </p>
      </div>

      {readOnly ? (
        <ul className="mt-5 space-y-2">
          {items.length ? (
            items.map((item) => (
              <li
                key={item}
                className="rounded-xl bg-white/65 px-3 py-2.5 text-sm font-semibold"
              >
                {item}
              </li>
            ))
          ) : (
            <li className="rounded-xl border border-dashed border-[var(--line)] px-3 py-6 text-center text-sm text-[var(--muted)]">
              No snacks listed yet.
            </li>
          )}
        </ul>
      ) : (
        <form action={saveSnackOptions} className="mt-5">
          <label className="block">
            <span className="sr-only">Snack options</span>
            <textarea
              name="snackOptions"
              defaultValue={snackOptions}
              placeholder={"Apples\nYogurt tubes\nCheese sticks\nGranola bars"}
              className="hub-input min-h-36 w-full resize-none leading-6"
              aria-label="Snack options"
            />
          </label>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            Put each snack on a new line, like routine steps.
          </p>
          <button className="hub-button mt-4 w-full">Save snack list</button>
        </form>
      )}
    </section>
  );
}
