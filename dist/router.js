function p(t) {
  return t.length > 1 && t.endsWith("/") ? t.slice(0, -1) : t;
}
function F(t) {
  return p(new URL(t, location.origin).pathname).split("/");
}
function ot(t) {
  return t.split("/").some((e) => e.startsWith(":"));
}
function G(t) {
  return t.split("/").filter((e) => e.startsWith(":")).length;
}
function it(t) {
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
}
let h = "";
function st(t = "") {
  const e = t.trim().replace(/^\/+|\/+$/g, "");
  return e ? `/${e}` : "";
}
function Z(t) {
  h = st(t);
}
function gt() {
  return h;
}
function W(t) {
  return h ? t === h ? "/" : t.startsWith(`${h}/`) ? t.slice(h.length) : null : t;
}
function J(t) {
  return h ? h + t : t;
}
function _() {
  return (W(location.pathname) ?? location.pathname) + location.search + location.hash;
}
const y = {}, N = /* @__PURE__ */ new Set();
function wt(t, e) {
  if (typeof t == "string") {
    if (!e)
      return () => {
      };
    const n = p(t);
    return y[n] || (y[n] = /* @__PURE__ */ new Set()), y[n].add(e), () => {
      var r;
      return (r = y[n]) == null ? void 0 : r.delete(e);
    };
  }
  return N.add(t), () => N.delete(t);
}
async function at(t) {
  const e = [
    ...N,
    ...y[t.path] ?? []
  ];
  for (const n of e)
    if (await n(t) === !1)
      return !1;
  return !0;
}
const g = {}, O = /* @__PURE__ */ new Set();
function bt(t, e) {
  if (typeof t == "string") {
    if (!e)
      return () => {
      };
    const n = p(t);
    return g[n] || (g[n] = /* @__PURE__ */ new Set()), g[n].add(e), () => {
      var r;
      return (r = g[n]) == null ? void 0 : r.delete(e);
    };
  }
  return O.add(t), () => O.delete(t);
}
function lt(t) {
  const e = [
    ...O,
    ...g[t.path] ?? []
  ];
  for (const n of e)
    n(t);
}
const w = {}, C = /* @__PURE__ */ new Set();
function Rt(t, e) {
  if (typeof t == "string") {
    if (!e)
      return () => {
      };
    const n = p(t);
    return w[n] || (w[n] = /* @__PURE__ */ new Set()), w[n].add(e), () => {
      var r;
      return (r = w[n]) == null ? void 0 : r.delete(e);
    };
  }
  return C.add(t), () => C.delete(t);
}
function ct(t, e) {
  const n = [
    ...C,
    ...t ? w[t.path] ?? [] : []
  ];
  for (const r of n)
    r(t, e);
}
function ut(t) {
  const e = new Blob([t], { type: "text/javascript" });
  return URL.createObjectURL(e);
}
function ft(t) {
  if (t instanceof Element)
    return { html: t, script: null };
  const e = document.createElement("template");
  e.innerHTML = t;
  const n = e.content.querySelector('script[type="module"]'), r = (n == null ? void 0 : n.textContent) ?? null;
  return n == null || n.remove(), {
    html: e.innerHTML,
    script: r
  };
}
function Y(t) {
  if (t instanceof Element)
    return t;
  const e = document.createElement("template");
  e.innerHTML = t;
  const n = e.content, r = Array.from(n.childNodes).filter((o) => o.nodeType === Node.ELEMENT_NODE ? !0 : o.nodeType === Node.TEXT_NODE && (o.textContent ?? "").trim().length > 0);
  return r.length === 1 && r[0].nodeType === Node.ELEMENT_NODE ? r[0] : n;
}
function ht(t) {
  return Array.from(t.children).filter((e) => {
    const n = e.tagName.toLowerCase();
    return n !== "script" && n !== "style";
  });
}
function B(t, e) {
  return t.filter((n) => dt(n.path, e)).sort((n, r) => G(n.path) - G(r.path))[0];
}
function dt(t, e) {
  const n = F(t), r = F(e);
  return n.length !== r.length ? !1 : n.every((o, i) => o.startsWith(":") ? r[i].length > 0 : o === r[i]);
}
function pt(t, e) {
  const [n, r] = Object.entries(e)[0];
  return t.find((o) => {
    var i;
    switch (n) {
      case "path":
        return o.path === p(r);
      case "html":
      case "title":
        return o[n] === r;
      case "startsWith":
        return o.path.startsWith(r);
      case "renderedHtml":
        return ((i = o.renderedHtml) == null ? void 0 : i.isEqualNode(r)) ?? !1;
      default:
        return !1;
    }
  });
}
let I = {}, x = {}, b = [], P = "", v = null, s = null, E = !1, D = 0;
function vt() {
  return v;
}
function Et(t, e = {}) {
  return E && L(), x = Object.freeze(e.provide ?? {}), Z(e.base), I = Object.freeze(t), b = Object.entries(t).map(([n, r]) => {
    const o = typeof r == "string" ? { html: r } : r;
    return {
      ...o,
      path: p(n),
      renderedHtml: null,
      module: null,
      query: {},
      hash: "",
      props: {},
      meta: o.meta ?? {}
    };
  }), {
    /**
     * Start the router. Resolves once the initial route has been rendered (or
     * failed to render, in which case `onRouteError` has been called).
     *
     * @param selector DOM selector
     */
    run: (n) => (E && L(), P = n, et(), E = !0, window.addEventListener("popstate", M), document.addEventListener("click", tt), T(mt(b), { replace: !0 }).catch(() => null)),
    /**
     * Stops the router. Navigation will no longer work.
     */
    stop: L
  };
}
function L() {
  var t;
  E = !1, P = "", v = null, D++, (t = s == null ? void 0 : s.unmount) == null || t.call(s), s = null, window.removeEventListener("popstate", M), document.removeEventListener("click", tt);
}
function M(t) {
  const e = t.state, n = (e == null ? void 0 : e.path) ?? _();
  T(n, { props: (e == null ? void 0 : e.props) ?? {}, isPopState: !0 }).catch(() => {
  });
}
function tt(t) {
  var d;
  if (t.defaultPrevented || t.button !== 0 || t.metaKey || t.ctrlKey || t.shiftKey || t.altKey)
    return;
  const e = t.target, n = (d = e == null ? void 0 : e.closest) == null ? void 0 : d.call(e, "a[link]");
  if (!n)
    return;
  const r = n.getAttribute("href");
  if (!r)
    return;
  const o = n.getAttribute("target");
  if (o && o !== "_self")
    return;
  const i = new URL(r, location.href);
  if (i.origin !== location.origin)
    return;
  const f = W(i.pathname) ?? i.pathname;
  B(b, f) && (t.preventDefault(), T(f + i.search + i.hash).catch(() => {
  }));
}
function mt(t) {
  const e = W(location.pathname);
  if (e !== null && B(t, e))
    return _();
  const n = t.find((o) => o.default || o.path === "/");
  if (n)
    return n.path;
  const r = t.filter((o) => !ot(o.path)).sort((o, i) => o.path.length - i.path.length)[0];
  if (r)
    return r.path;
  throw new Error("No default route found. Please define one by settings its path to `/` or adding the `default` property to the route definitions. Note, it is not possible to set dynamic routes as default routes.");
}
function et() {
  if (!P)
    throw new Error("No root selector found. Did you start the router?");
  const t = document.querySelector(P);
  if (!t)
    throw new Error("Invalid root node selector. Please select a valid HTML element.");
  return t;
}
function St() {
  return I;
}
function yt(t, e) {
  const n = new URL(t, location.origin), r = n.hash.replace(/^#/, ""), o = Object.fromEntries(n.searchParams), i = p(n.pathname), f = B(e, i);
  if (!f)
    throw new Error(`No matching route found for the path "${i}"`);
  const d = f.path.split("/"), R = i.split("/"), a = {};
  for (let l = 0; l < d.length; l++) {
    const u = d[l];
    u.startsWith(":") && (a[u.substring(1)] = it(R[l]));
  }
  return {
    resolvedPath: i,
    sourcePath: f.path,
    params: a,
    hash: r,
    query: o
  };
}
async function T(t, e = {}) {
  var $;
  const {
    replace: n = !1,
    hash: r,
    query: o,
    props: i = {},
    isPopState: f = !1
  } = e, d = ++D, R = () => d === D;
  let a, l = "", u = {};
  try {
    if (!E)
      throw new Error("Router is not running. Call `defineRouter(...).run(selector)` first.");
    const m = yt(t, b), { resolvedPath: H, sourcePath: z, params: j } = m;
    if (l = m.hash, u = m.query, r !== void 0 && (l = r === !1 ? "" : String(r).replace(/^#/, "")), o)
      for (const c of Object.keys(o))
        u[c] = String(o[c]);
    if (a = pt(b, { path: z }), !a)
      throw new Error("Invalid path. Could not match route.");
    const { html: nt, script: A } = ft(a.html);
    let S = Y(nt), K = (s == null ? void 0 : s.beforeLeave) && await s.beforeLeave();
    if (K = await at({ ...a, renderedHtml: S, hash: l, query: u, props: i }), K === !1 || !R())
      return null;
    let U = null;
    if (a.loader) {
      try {
        U = await a.loader(j);
      } catch (c) {
        if (!a.fallback)
          throw c;
        S = Y(a.fallback);
      }
      if (!R())
        return null;
    }
    const V = new URLSearchParams(u).toString(), k = H + (V ? `?${V}` : "") + (l ? `#${l}` : ""), Q = et();
    if (v = Object.freeze({
      ...a,
      path: z,
      resolvedPath: H,
      renderedHtml: S,
      params: j,
      data: U,
      hash: l,
      query: u,
      props: i
    }), !f) {
      const c = {
        path: k,
        props: i
      };
      n || k === _() ? history.replaceState(c, "", J(k)) : history.pushState(c, "", J(k));
    }
    if (($ = s == null ? void 0 : s.unmount) == null || $.call(s), s = null, Q.replaceChildren(S), A) {
      const c = ut(A);
      try {
        const rt = await import(
          /* @vite-ignore */
          c
        );
        if (!R())
          return null;
        const X = ht(Q);
        X.length > 1 && console.warn("Page using a <script> should have only 1 root element. Only the first element will be passed as the root when calling mount()");
        const q = await rt.mount(X[0], {
          path: H,
          data: U,
          props: i,
          params: j,
          query: u,
          navigate: T,
          provide: x
        });
        s = typeof q == "function" ? { unmount: q } : q ?? null;
      } finally {
        URL.revokeObjectURL(c);
      }
    }
    if (a.title && (document.title = a.title), l) {
      const c = document.getElementById(l);
      c && typeof c.scrollIntoView == "function" && c.scrollIntoView();
    }
    return lt(v), v;
  } catch (m) {
    throw ct(a ? { ...a, hash: l, query: u, props: i } : null, m), m;
  }
}
function kt() {
  L(), I = {}, x = {}, Z(), b = [], N.clear(), O.clear(), C.clear();
  for (const t of [y, g, w])
    for (const e of Object.keys(t))
      delete t[e];
}
export {
  Et as defineRouter,
  pt as findRoute,
  gt as getBase,
  vt as getRoute,
  St as getRouterConfig,
  et as getRouterRoot,
  dt as isMatching,
  B as matchRoute,
  T as navigate,
  wt as onNavigation,
  Rt as onRouteError,
  bt as onRouteResolve,
  kt as resetRouter,
  yt as resolvePath
};
