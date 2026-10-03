// oxlint-disable-next-line typescript/consistent-type-definitions, typescript/no-empty-object-type -- Hosts augment this public interface with their branch identifiers.
export interface Branches {}

export type BranchId = keyof Branches;
