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

export function decodeGameLocations(value: unknown): GameLocation[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const locations: GameLocation[] = [];
  const storedLocations: readonly unknown[] = value;
  for (const location of storedLocations) {
    if (
      typeof location !== "object" ||
      location === null ||
      !("branchId" in location) ||
      typeof location.branchId !== "string" ||
      location.branchId === "" ||
      !("statementIndex" in location) ||
      typeof location.statementIndex !== "number" ||
      !Number.isFinite(location.statementIndex)
    ) {
      return null;
    }

    // SAFETY: Stored branch names are validated strings. Hosts augment the
    // branch registry at compile time, and rendering resolves names at runtime.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Persisted names cross the declaration-merging boundary.
    const branchId = location.branchId as BranchId;
    locations.push({ branchId, statementIndex: location.statementIndex });
  }

  return locations;
}
