import type { BranchId } from "#types.ts";

export type GameLocation<TBranchId extends string = BranchId> = {
  branchId: TBranchId;
  statementIndex: number;
};

export function makeGameLocationId(location: GameLocation<string>) {
  return `${location.branchId}-${location.statementIndex}`;
}

export function parseGameLocation(
  locationId: string,
): GameLocation<string> | null {
  // NOTE: Branch names can contain hyphens. Only the final separator owns
  // the statement index. Legacy branch-only URLs still select statement zero.
  const separatorIndex = locationId.lastIndexOf("-");

  const branchName =
    separatorIndex === -1 ? locationId : locationId.slice(0, separatorIndex);

  const indexText =
    separatorIndex === -1 ? "0" : locationId.slice(separatorIndex + 1);

  const statementIndex = Number(indexText);
  if (
    branchName === "" ||
    !/^\d+$/u.test(indexText) ||
    !Number.isSafeInteger(statementIndex)
  ) {
    return null;
  }

  const branchId = branchName;
  return { branchId, statementIndex };
}

export function decodeGameLocations(
  value: unknown,
): GameLocation<string>[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const locations: GameLocation<string>[] = [];
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
      !Number.isSafeInteger(location.statementIndex) ||
      location.statementIndex < 0
    ) {
      return null;
    }

    const branchId = location.branchId;
    locations.push({ branchId, statementIndex: location.statementIndex });
  }

  return locations;
}
