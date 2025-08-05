import { useState } from "react";

export type Vote = number | "🐘" | null;

export type PlayerID = string;

export type Player = {
  id: PlayerID;
  name: string;
};

export type GameState = {
  players: Readonly<Record<PlayerID, { name: string; vote: Vote }>>;
  votesVisible: Readonly<boolean>;
};

export function usePointingPokerGame() {
  const [gameState, setGameState] = useState<GameState>({
    players: {},
    votesVisible: false,
  });

  const vote = (player: Player, vote: Vote) => {
    setGameState((old) => {
      return {
        votesVisible: old.votesVisible,
        players: {
          ...old.players,
          [player.id]: {
            name: player.name,
            vote: vote,
          },
        },
      };
    });
  };

  const addPlayer = (player: Player) => {
    vote(player, null);
  };

  const removePlayer = (player: Player) => {
    setGameState((old) => {
      const { [player.id]: _, ...rest } = old.players;
      return {
        votesVisible: old.votesVisible,
        players: rest,
      };
    });
  };

  const syncFullState = (state: GameState) => {
    setGameState(state);
  };

  const setVotesVisible = (visible: boolean) => {
    setGameState((prev) => {
      return {
        ...prev,
        votesVisible: visible,
      };
    });
  };

  const clearVotes = () => {
    setGameState((old) => {
      return {
        ...old,
        votesVisible: false,
        players: Object.fromEntries(
          Object.entries(old.players).map(([id, player]) => [
            id,
            { ...player, vote: null },
          ]),
        ),
      };
    });
  };

  return {
    gameState,
    vote,
    addPlayer,
    removePlayer,
    setVotesVisible,
    syncFullState,
    clearVotes,
  };
}
