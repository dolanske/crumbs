function h(t) {
  return t.length > 1 && t.endsWith("/") ? t.slice(0, -1) : t;
}
function V(t) {
  return h(new URL(t, location.origin).pathname).split("/");
}
function tt(t) {
  return t.split("/").some((e) => e.startsWith(":"));
}
function Q(t) {
  return t.split("/").filter((e) => e.startsWith(":")).length;
}
function et(t) {
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
}
function D() {
  return location.pathname + location.search + location.hash;
}
const p = {}, L = /* @__PURE__ */ new Set();
function ht(t, e) {
  if (typeof t == "string") {
    if (!e)
      return () => {
      };
    const n = h(t);
    return p[n] || (p[n] = /* @__PURE__ */ new Set()), p[n].add(e), () => {
      var r;
      return (r = p[n]) == null ? void 0 : r.delete(e);
    };
  }
  return L.add(t), () => L.delete(t);
}
async function nt(t) {
  const e = [
    ...L,
    ...p[t.path] ?? []
  ];
  for (const n of e)
    if (await n(t) === !1)
      return !1;
  return !0;
}
const m = {}, N = /* @__PURE__ */ new Set();
function dt(t, e) {
  if (typeof t == "string") {
    if (!e)
      return () => {
      };
    const n = h(t);
    return m[n] || (m[n] = /* @__PURE__ */ new Set()), m[n].add(e), () => {
      var r;
      return (r = m[n]) == null ? void 0 : r.delete(e);
    };
  }
  return N.add(t), () => N.delete(t);
}
function rt(t) {
  const e = [
    ...N,
    ...m[t.path] ?? []
  ];
  for (const n of e)
    n(t);
}
const y = {}, O = /* @__PURE__ */ new Set();
function pt(t, e) {
  if (typeof t == "string") {
    if (!e)
      return () => {
      };
    const n = h(t);
    return y[n] || (y[n] = /* @__PURE__ */ new Set()), y[n].add(e), () => {
      var r;
      return (r = y[n]) == null ? void 0 : r.delete(e);
    };
  }
  return O.add(t), () => O.delete(t);
}
function ot(t, e) {
  const n = [
    ...O,
    ...t ? y[t.path] ?? [] : []
  ];
  for (const r of n)
    r(t, e);
}
function it(t) {
  const e = new Blob([t], { type: "text/javascript" });
  return URL.createObjectURL(e);
}
function st(t) {
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
function X(t) {
  if (t instanceof Element)
    return t;
  const e = document.createElement("template");
  e.innerHTML = t;
  const n = e.content, r = Array.from(n.childNodes).filter((o) => o.nodeType === Node.ELEMENT_NODE ? !0 : o.nodeType === Node.TEXT_NODE && (o.textContent ?? "").trim().length > 0);
  return r.length === 1 && r[0].nodeType === Node.ELEMENT_NODE ? r[0] : n;
}
function at(t) {
  return Array.from(t.children).filter((e) => {
    const n = e.tagName.toLowerCase();
    return n !== "script" && n !== "style";
  });
}
function _(t, e) {
  return t.filter((n) => lt(n.path, e)).sort((n, r) => Q(n.path) - Q(r.path))[0];
}
function lt(t, e) {
  const n = V(t), r = V(e);
  return n.length !== r.length ? !1 : n.every((o, i) => o.startsWith(":") ? r[i].length > 0 : o === r[i]);
}
function ct(t, e) {
  const [n, r] = Object.entries(e)[0];
  return t.find((o) => {
    var i;
    switch (n) {
      case "path":
        return o.path === h(r);
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
let I = {}, F = {}, g = [], C = "", b = null, s = null, R = !1, q = 0;
function mt() {
  return b;
}
function yt(t, e) {
  return R && k(), e && (F = Object.freeze(e)), I = Object.freeze(t), g = Object.entries(t).map(([n, r]) => {
    const o = typeof r == "string" ? { html: r } : r;
    return {
      ...o,
      path: h(n),
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
    run: (n) => (R && k(), C = n, Y(), R = !0, window.addEventListener("popstate", G), document.addEventListener("click", J), P(ut(g), { replace: !0 }).catch(() => null)),
    /**
     * Stops the router. Navigation will no longer work.
     */
    stop: k
  };
}
function k() {
  var t;
  R = !1, C = "", b = null, q++, (t = s == null ? void 0 : s.unmount) == null || t.call(s), s = null, window.removeEventListener("popstate", G), document.removeEventListener("click", J);
}
function G(t) {
  const e = t.state, n = (e == null ? void 0 : e.path) ?? D();
  P(n, { props: (e == null ? void 0 : e.props) ?? {}, isPopState: !0 }).catch(() => {
  });
}
function J(t) {
  var f;
  if (t.defaultPrevented || t.button !== 0 || t.metaKey || t.ctrlKey || t.shiftKey || t.altKey)
    return;
  const e = t.target, n = (f = e == null ? void 0 : e.closest) == null ? void 0 : f.call(e, "a[link]");
  if (!n)
    return;
  const r = n.getAttribute("href");
  if (!r)
    return;
  const o = n.getAttribute("target");
  if (o && o !== "_self")
    return;
  const i = new URL(r, location.href);
  i.origin === location.origin && _(g, i.pathname) && (t.preventDefault(), P(i.pathname + i.search + i.hash).catch(() => {
  }));
}
function ut(t) {
  if (_(t, location.pathname))
    return D();
  const e = t.find((r) => r.default || r.path === "/");
  if (e)
    return e.path;
  const n = t.filter((r) => !tt(r.path)).sort((r, o) => r.path.length - o.path.length)[0];
  if (n)
    return n.path;
  throw new Error("No default route found. Please define one by settings its path to `/` or adding the `default` property to the route definitions. Note, it is not possible to set dynamic routes as default routes.");
}
function Y() {
  if (!C)
    throw new Error("No root selector found. Did you start the router?");
  const t = document.querySelector(C);
  if (!t)
    throw new Error("Invalid root node selector. Please select a valid HTML element.");
  return t;
}
function gt() {
  return I;
}
function ft(t, e) {
  const n = new URL(t, location.origin), r = n.hash.replace(/^#/, ""), o = Object.fromEntries(n.searchParams), i = h(n.pathname), f = _(e, i);
  if (!f)
    throw new Error(`No matching route found for the path "${i}"`);
  const v = f.path.split("/"), w = i.split("/"), a = {};
  for (let l = 0; l < v.length; l++) {
    const u = v[l];
    u.startsWith(":") && (a[u.substring(1)] = et(w[l]));
  }
  return {
    resolvedPath: i,
    sourcePath: f.path,
    params: a,
    hash: r,
    query: o
  };
}
async function P(t, e = {}) {
  var W;
  const {
    replace: n = !1,
    hash: r,
    query: o,
    props: i = {},
    isPopState: f = !1
  } = e, v = ++q, w = () => v === q;
  let a, l = "", u = {};
  try {
    if (!R)
      throw new Error("Router is not running. Call `defineRouter(...).run(selector)` first.");
    const d = ft(t, g), { resolvedPath: T, sourcePath: x, params: H } = d;
    if (l = d.hash, u = d.query, r !== void 0 && (l = r === !1 ? "" : String(r).replace(/^#/, "")), o)
      for (const c of Object.keys(o))
        u[c] = String(o[c]);
    if (a = ct(g, { path: x }), !a)
      throw new Error("Invalid path. Could not match route.");
    const { html: Z, script: z } = st(a.html);
    let E = X(Z), A = (s == null ? void 0 : s.beforeLeave) && await s.beforeLeave();
    if (A = await nt({ ...a, renderedHtml: E, hash: l, query: u, props: i }), A === !1 || !w())
      return null;
    let j = null;
    if (a.loader) {
      try {
        j = await a.loader(H);
      } catch (c) {
        if (!a.fallback)
          throw c;
        E = X(a.fallback);
      }
      if (!w())
        return null;
    }
    const K = new URLSearchParams(u).toString(), S = T + (K ? `?${K}` : "") + (l ? `#${l}` : ""), $ = Y();
    if (b = Object.freeze({
      ...a,
      path: x,
      resolvedPath: T,
      renderedHtml: E,
      params: H,
      data: j,
      hash: l,
      query: u,
      props: i
    }), !f) {
      const c = {
        path: S,
        props: i
      };
      n || S === D() ? history.replaceState(c, "", S) : history.pushState(c, "", S);
    }
    if ((W = s == null ? void 0 : s.unmount) == null || W.call(s), s = null, $.replaceChildren(E), z) {
      const c = it(z);
      try {
        const M = await import(
          /* @vite-ignore */
          c
        );
        if (!w())
          return null;
        const B = at($);
        B.length > 1 && console.warn("Page using a <script> should have only 1 root element. Only the first element will be passed as the root when calling mount()");
        const U = await M.mount(B[0], {
          path: T,
          data: j,
          props: i,
          params: H,
          query: u,
          navigate: P,
          provide: F
        });
        s = typeof U == "function" ? { unmount: U } : U ?? null;
      } finally {
        URL.revokeObjectURL(c);
      }
    }
    if (a.title && (document.title = a.title), l) {
      const c = document.getElementById(l);
      c && typeof c.scrollIntoView == "function" && c.scrollIntoView();
    }
    return rt(b), b;
  } catch (d) {
    throw ot(a ? { ...a, hash: l, query: u, props: i } : null, d), d;
  }
}
function wt() {
  k(), I = {}, g = [], L.clear(), N.clear(), O.clear();
  for (const t of [p, m, y])
    for (const e of Object.keys(t))
      delete t[e];
}
export {
  yt as defineRouter,
  ct as findRoute,
  mt as getRoute,
  gt as getRouterConfig,
  Y as getRouterRoot,
  lt as isMatching,
  _ as matchRoute,
  P as navigate,
  ht as onNavigation,
  pt as onRouteError,
  dt as onRouteResolve,
  wt as resetRouter,
  ft as resolvePath
};
