import type { BranchId } from "#types.ts";

export type GameLocation = {
  branchId: BranchId;
  statementIndex: number;
};

export function makeGameLocationId(location: GameLocation) {
  return `${String(location.branchId)}-${location.statementIndex}`;
}

export function parseGameLocation(locationId: string): GameLocation | null {
  const [_branchId, __statementIndex] = locationId.split("-");
  if (_branchId === undefined || _branchId === "") {
    return null;
  }

  // SAFETY: Serialized IDs contain a nonempty branch name. The host's declaration-merging registry has no runtime representation, so rendering resolves the branch.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Preserve the host-defined branch type at the persisted identifier boundary.
  const branchId = _branchId as BranchId;

  const _statementIndex = Number(__statementIndex);
  const statementIndex = Number.isNaN(_statementIndex) ? 0 : _statementIndex;
  return { branchId, statementIndex };
}
