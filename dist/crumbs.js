let D = {}, v = [], k = "", m;
function W() {
  return m;
}
function B(t) {
  D = Object.freeze(t);
  const e = Object.entries(t).map(([o, r]) => typeof r == "string" ? {
    html: r,
    renderedHtml: E(r),
    path: o,
    query: {},
    hash: "",
    props: {}
  } : {
    ...r,
    path: o,
    renderedHtml: E(r.html),
    query: {},
    hash: "",
    props: {}
  });
  v = e;
  function n(o) {
    const { path: r, props: s } = o.state;
    C(r, { props: s, isPopState: !0 });
  }
  return {
    /**
     * Start the router.
     *
     * @param selector DOM selector
     */
    run: (o) => {
      k = o, window.addEventListener("popstate", n), A(), C(I(e));
    },
    /**
     * Stops the router. Navigation will no longer work.
     */
    stop() {
      window.removeEventListener("popstate", n);
    }
  };
}
function I(t) {
  let e;
  if (t.find((n) => O(n.path, location.pathname)))
    return location.pathname + location.search + location.hash;
  if (e = t.find((n) => n.default || n.path === "/"), e || (e = t.sort((n, o) => n.path.length - o.path.length)[0], e))
    return e.path;
  throw new Error("No default route found. Please define one by settings its path to `/` or adding the `default` property to the route definitions. Note, it is not possible to set dynamic routes as default routes.");
}
function E(t) {
  return t instanceof Element ? t : new DOMParser().parseFromString(t, "text/html").body.firstElementChild;
}
function x() {
  if (!k)
    throw new Error("No root selector found. Did you start the router?");
  const t = document.querySelector(k);
  if (!t)
    throw new Error("Invalid root node selector. Please select a valid HTML element.");
  return t;
}
function G() {
  return D;
}
function j(t) {
  const [e, n] = Object.entries(t)[0];
  return v.find((o) => {
    var r;
    switch (e) {
      case "path":
      case "html":
      case "title":
        return o[e] === n;
      case "startsWith":
        return o.path.startsWith(n);
      case "renderedHtml":
        return (r = o.renderedHtml) == null ? void 0 : r.isEqualNode(n);
      default:
        return null;
    }
  });
}
function O(t, e) {
  if (t === e)
    return !0;
  t = new URL(t, location.origin).pathname, e = new URL(e, location.origin).pathname;
  const n = t.split("/"), o = e.split("/");
  return n.every((r, s) => r.startsWith(":") ? !0 : r === o[s]);
}
function M(t, e) {
  const n = new URL(t, location.origin), o = n.hash, r = Object.fromEntries(n.searchParams), s = n.pathname, h = e.find((i) => O(i.path, s));
  if (!h)
    throw new Error(`No matching route found for the path "${s}"`);
  const f = h.path.split("/"), u = s.split("/"), l = {};
  for (let i = 0; i < f.length; i++) {
    const c = f[i];
    if (!c || !c.startsWith(":"))
      continue;
    const p = c.substring(1), d = u[i];
    l[p] = d;
  }
  return {
    resolvedPath: s,
    sourcePath: h.path,
    params: l,
    hash: o,
    query: r
  };
}
function A() {
  var n;
  const e = x().querySelectorAll("a[link]");
  for (const o of e) {
    const r = (n = o.getAttributeNode("href")) == null ? void 0 : n.value;
    r && o.addEventListener("click", (s) => {
      s.preventDefault(), v.some((f) => O(f.path, r)) && C(r);
    });
  }
}
async function C(t, e = {}) {
  const {
    replace: n = !1,
    hash: o,
    query: r,
    props: s = {},
    isPopState: h = !1
  } = e, f = new Promise(async (u, l) => {
    let {
      resolvedPath: i,
      sourcePath: c,
      params: p,
      hash: d,
      query: S
    } = M(t, v);
    if (o && (d = String(o)), r)
      for (const g of Object.keys(r))
        S[g] = String(r[g]);
    const a = j({ path: c });
    if (!a)
      return l(new Error("Invalid path. Could not match route."));
    let P = E(a.html);
    T({ ...a, path: t, renderedHtml: P, hash: d, query: S, props: s }) === !1 && u(null);
    let L;
    a.loader && (L = await a.loader(p).then((g) => g).catch((g) => a.fallback ? (P = E(a.fallback), null) : l(new Error(g)))), m = Object.freeze({
      ...a,
      path: c,
      resolvedPath: i,
      renderedHtml: P,
      params: p,
      data: L,
      hash: d,
      query: S,
      props: s
    });
    const U = new URLSearchParams(S), $ = U.size > 0 ? `?${U.toString()}` : "", b = i + $ + (d ? `#${d}` : "");
    h || (n ? history.replaceState({ path: b, props: s }, "", b) : history.pushState({ path: b, props: s }, "", b)), x().replaceChildren(m.renderedHtml), A(), a.title && (document.title = a.title), _(m), u(m);
  });
  return f.catch((u) => {
    const l = j({ path: t });
    if (l) {
      const { sourcePath: i, hash: c, query: p } = M(t, v);
      z({
        ...l,
        path: i,
        renderedHtml: null,
        hash: c,
        query: p,
        props: s
      }, u);
    } else
      z(null, u);
  }), f;
}
const y = {}, H = /* @__PURE__ */ new Set();
function J(t, e) {
  if (typeof t == "string") {
    if (!e)
      return;
    y[t] || (y[t] = /* @__PURE__ */ new Set()), y[t].add(e);
  } else
    t && H.add(t);
  return () => {
    typeof t == "string" ? e && y[t].delete(e) : H.delete(t);
  };
}
function T(t) {
  for (const n of H)
    n(t);
  const e = y[t.path];
  if (e)
    for (const n of e)
      n(t);
}
const w = {}, q = /* @__PURE__ */ new Set();
function K(t, e) {
  return typeof t == "string" ? e && (w[t] || (w[t] = /* @__PURE__ */ new Set()), w[t].add(e)) : q.add(t), () => {
    typeof t == "string" ? e && w[t].delete(e) : q.delete(t);
  };
}
function _(t) {
  for (const n of q)
    n(t);
  const e = w[t.path];
  if (e)
    for (const n of e)
      n(t);
}
const R = {}, N = /* @__PURE__ */ new Set();
function X(t, e) {
  return typeof t == "string" ? e && (R[t] || (R[t] = /* @__PURE__ */ new Set()), R[t].add(e)) : N.add(t), () => {
    typeof t == "string" ? e && R[t].delete(e) : N.delete(t);
  };
}
function z(t, e) {
  for (const n of N)
    n(t, e);
  if (t) {
    const n = R[t.path];
    if (n)
      for (const o of n)
        o(t, e);
  }
}
export {
  B as defineRouter,
  W as getRoute,
  G as getRouterConfig,
  x as getRouterRoot,
  O as isMatching,
  C as navigate,
  J as onNavigation,
  X as onRouteError,
  K as onRouteResolve,
  M as resolvePath
};
