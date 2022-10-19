import type {BranchId} from '../../types'

export interface GameLocation {
  branchId: BranchId
  statementIndex: number
}

export function makeGameLocationId(location: GameLocation) {
  return `${location.branchId}-${location.statementIndex}`
}

export function parseGameLocation(locationId: string): GameLocation | null {
  const [_branchId, __statementIndex] = locationId.split('-')
  const branchId = _branchId as BranchId
  const _statementIndex = Number(__statementIndex)
  const statementIndex = Number.isNaN(_statementIndex) ? 0 : _statementIndex
  return {branchId, statementIndex}
}
