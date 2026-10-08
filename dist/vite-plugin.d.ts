/**
 * Simple vite plugin which transforms any `.page.html` into vite consumable `.html?raw`.
 * This is purely just a syntax improvement
 */
declare function crumbs(): {
    readonly name: "page-html-as-raw";
    readonly enforce: "pre";
    readonly resolveId: (this: any, source: string, importer: string | undefined, options: any) => Promise<string | null>;
    readonly load: (this: any, id: string) => Promise<string | null>;
};
export default crumbs;

export { }
