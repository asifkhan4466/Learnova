// Existing local-storage records and configurable table/form callbacks have dynamic
// schemas. Keep that boundary explicit while retaining strict checking elsewhere.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LegacyValue = any;
