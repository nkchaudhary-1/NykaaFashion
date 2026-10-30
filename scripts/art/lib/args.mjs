// Shared CLI helpers.
/**
 * --only filter: comma list of exact ids or glob patterns where `*` matches any run of characters
 * (so `products/p-001*`, `samples/dress/*-front` and `*-detail` all work).
 */
export function matchOnly(only, id) {
  if (!only) return true;
  return only.split(',').map((s) => s.trim()).filter(Boolean).some((p) => {
    if (!p.includes('*')) return id === p;
    const re = new RegExp('^' + p.split('*').map((x) => x.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
    return re.test(id);
  });
}
