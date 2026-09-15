/**
 * Column allow-list for `.update()` / `.insert()` payloads.
 *
 * Declared TypeScript parameter types are erased at runtime, and a server
 * action is a public HTTP endpoint (Next.js exposes every exported action by
 * its generated id, whether or not a page links to it) — so `data: SomeType`
 * on a function signature is not protection against a crafted payload that
 * reaches `.update(data)`. `pick()` is the runtime enforcement: it copies
 * only the keys named in `allowed` and drops everything else, so a caller
 * cannot smuggle `created_by`, `id`, an owning foreign key, or any other
 * column the action doesn't intend to expose.
 *
 * A key present in `allowed` but `undefined` on `source` is skipped, so a
 * partial-patch call site (`{ name: undefined }`) doesn't clobber a column
 * it never intended to touch.
 */
export function pick<T extends object, K extends readonly (keyof T)[]>(
  source: T,
  allowed: K
): Pick<T, K[number]> {
  const result = {} as Pick<T, K[number]>;
  for (const key of allowed) {
    const value = source[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}
