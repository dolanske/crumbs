import type { Route } from './types'

type Cast<A, B> = A extends B ? A : B

type Narrowable =
  | string
  | number
  | bigint
  | boolean

export type Narrow<A> = Cast<A, | []
  | (A extends Narrowable ? A : never)
  | ({ [K in keyof A]: Narrow<A[K]> })>

export type ExtractPaths<T extends Route[]> = T[number]['path']
