export type ShallowReadonly<T> = { readonly [key in keyof T]: T[key] }
