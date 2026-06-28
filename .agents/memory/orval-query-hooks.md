---
name: Orval query hooks in this repo
description: How generated React Query hooks must be called and why a queryKey is mandatory
---

In this repo the Orval config generates query hooks (e.g. `useGetMatrix`, `useGetBazi`,
`useGetFengShui`) whose options object **requires** an explicit `queryKey`. Calling
`useGetMatrix({ query: { retry: false } })` fails typecheck with TS2741 (queryKey missing).

**Rule:** always pass the matching key helper:
`useGetMatrix({ query: { queryKey: getGetMatrixQueryKey() } })`.
Each query hook has a sibling `getGet<Name>QueryKey(...)` (parameterized ones take the same args).

**Why:** the generated `UseQueryOptions` type does not default `queryKey`, so it is structurally
required even though react-query could infer it at runtime.

**How to apply:** when wiring any generated query hook in `artifacts/web`, import and pass the
key helper alongside other query options.
