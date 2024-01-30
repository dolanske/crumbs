let P = {}, g = [], w = "", c;
function U() {
  return structuredClone(c);
}
function W(t) {
  P = Object.freeze(t);
  const e = Object.entries(t).map(([o, r]) => typeof r == "string" ? {
    html: r,
    renderedHtml: p(r),
    path: o
  } : {
    ...r,
    path: o,
    renderedHtml: p(r.html)
  });
  g = e;
  function n(o) {
    v(o.state.path);
  }
  return {
    /**
     * Start the router.
     *
     * @param selector DOM selector
     */
    run: (o) => {
      w = o, window.addEventListener("popstate", n), O(), v(L(e));
    },
    /**
     * Stops the router. Navigation will no longer work.
     */
    stop() {
      window.removeEventListener("popstate", n);
    }
  };
}
function L(t) {
  let e;
  if (e = t.find((n) => n.default || n.path === "/"), e || (e = t.sort((n, o) => n.path.length - o.path.length)[0], e))
    return e.path;
  throw new Error("No default route found. Please define one by settings its path to `/` or adding the `default` property to the route definitions. Note, it is not possible to set dynamic routes as default routes.");
}
function p(t) {
  return t instanceof Element ? t : new DOMParser().parseFromString(t, "text/html").body.firstElementChild;
}
function H() {
  if (!w)
    throw new Error("No root selector found. Did you start the router?");
  const t = document.querySelector(w);
  if (!t)
    throw new Error("Invalid root node selector. Please select a valid HTML element.");
  return t;
}
function j() {
  return P;
}
function E(t) {
  const [e, n] = Object.entries(t)[0];
  return g.find((o) => {
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
function N(t, e) {
  if (t === e)
    return !0;
  const n = t.split("/"), o = e.split("/");
  return n.every((r, s) => r.startsWith(":") ? !0 : r === o[s]);
}
function C(t, e) {
  const n = e.find((l) => N(l.path, t));
  if (!n)
    throw new Error(`No matching route found for the path "${t}"`);
  const o = n.path.split("/"), r = t.split("/"), s = {};
  for (let l = 0; l < o.length; l++) {
    const u = o[l];
    if (!u || !u.startsWith(":"))
      continue;
    const i = u.substring(1), f = r[l];
    s[i] = f;
  }
  return {
    resolvedPath: t,
    sourcePath: n.path,
    params: s
  };
}
function O() {
  var n;
  const e = H().querySelectorAll("a[link]");
  for (const o of e) {
    const r = (n = o.getAttributeNode("href")) == null ? void 0 : n.value;
    r && o.addEventListener("click", (s) => {
      s.preventDefault(), g.some((u) => N(u.path, r)) && v(r, !0);
    });
  }
}
async function v(t, e) {
  const n = new Promise(async (o, r) => {
    const {
      resolvedPath: s,
      sourcePath: l,
      params: u
    } = C(t, g), i = E({ path: l });
    if (!i)
      return r(new Error("Invalid path. Could not match route."));
    let f = p(i.html);
    M({ ...i, path: t, renderedHtml: f }) === !1 && o(null);
    let S;
    i.loader && (S = await i.loader(u).then((m) => m).catch((m) => i.fallback ? (f = p(i.fallback), null) : r(new Error(m)))), c = {
      ...i,
      path: l,
      resolvedPath: s,
      renderedHtml: f,
      params: u,
      data: S
    }, e ? history.replaceState({ path: t }, "", s) : history.pushState({ path: t }, "", s), H().replaceChildren(c.renderedHtml), O(), i.title && (document.title = i.title), D(c), o(c);
  });
  return n.catch((o) => {
    const r = E({ path: t });
    if (r) {
      const { sourcePath: s } = C(t, g);
      k({ ...r, path: s, renderedHtml: null }, o);
    } else
      k(null, o);
  }), n;
}
const a = {}, R = /* @__PURE__ */ new Set();
function z(t, e) {
  if (typeof t == "string") {
    if (!e)
      return;
    a[t] || (a[t] = /* @__PURE__ */ new Set()), a[t].add(e);
  } else
    t && R.add(t);
  return () => {
    typeof t == "string" ? e && a[t].delete(e) : R.delete(t);
  };
}
function M(t) {
  for (const n of R)
    n(t);
  const e = a[t.path];
  if (e)
    for (const n of e)
      n(t);
}
const d = {}, y = /* @__PURE__ */ new Set();
function A(t, e) {
  return typeof t == "string" ? e && (d[t] || (d[t] = /* @__PURE__ */ new Set()), d[t].add(e)) : y.add(t), () => {
    typeof t == "string" ? e && d[t].delete(e) : y.delete(t);
  };
}
function D(t) {
  for (const n of y)
    n(t);
  const e = d[t.path];
  if (e)
    for (const n of e)
      n(t);
}
const h = {}, b = /* @__PURE__ */ new Set();
function I(t, e) {
  return typeof t == "string" ? e && (h[t] || (h[t] = /* @__PURE__ */ new Set()), h[t].add(e)) : b.add(t), () => {
    typeof t == "string" ? e && h[t].delete(e) : b.delete(t);
  };
}
function k(t, e) {
  for (const n of b)
    n(t, e);
  if (t) {
    const n = h[t.path];
    if (n)
      for (const o of n)
        o(t, e);
  }
}
export {
  W as defineRouter,
  U as getRoute,
  j as getRouterConfig,
  H as getRouterRoot,
  N as isMatching,
  v as navigate,
  z as onNavigation,
  I as onRouteError,
  A as onRouteResolve,
  C as resolvePath
};
