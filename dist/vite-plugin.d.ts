/**
 * Simple vite plugin which transforms any `.page.html` into vite consumable `.html?raw`.
 * This is purely just a syntax improvement
 */
declare function crumbs(): {
    readonly name: "page-html-as-raw";
    readonly enforce: "pre";
    readonly load: (id: any) => Promise<string | null>;
};
export default crumbs;

export { }
