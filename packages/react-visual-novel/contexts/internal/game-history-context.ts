import { createContext } from "react";
import type { GameHistory } from "./game-history.ts";

// NOTE: Statement registration resolves bounds after the branch mounts.
// Recovery resets the same history owner without expanding the public API.
export const GameHistoryContext = createContext<GameHistory | null>(null);
