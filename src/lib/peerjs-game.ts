import Emittery from "emittery";
import * as PeerJS from "peerjs";
import { useEffect, useRef, useState } from "react";
import {
  usePointingPokerGame,
  type GameState,
  type Player,
  type Vote,
} from "./game";

type Events = {
  vote: PlayerVoteEvent;
  playerJoin: PlayerJoinEvent;
  playerLeave: PlayerLeaveEvent;
  toggleVotesShown: ToggleVotesShownEvent;
  clearVotes: ClearVotesEvent;
  syncState: SyncStateEvent;
};

type EventData = {
  [K in keyof Events]: { event: K } & Events[K];
}[keyof Events];

type PlayerVoteEvent = {
  player: Player;
  vote: Vote;
};

type PlayerJoinEvent = {
  player: Player;
};

type PlayerLeaveEvent = {
  player: Player;
};

type ToggleVotesShownEvent = {
  shown: boolean;
};

type ClearVotesEvent = {};

type SyncStateEvent = {
  gameState: GameState;
};

export function usePeerJsPointingGame(roomId: string, name: string) {
  const [emitter] = useState<Emittery<Events>>(new Emittery());
  const {
    gameState,
    vote,
    addPlayer,
    removePlayer,
    setVotesVisible,
    syncFullState,
    clearVotes,
  } = usePointingPokerGame();
  const { host } = useHostPeer(roomId, gameState);
  const { messageSender, player } = useClientPeer(roomId, name, host, emitter);

  useEffect(() => {
    const unsubscribers = [
      emitter.on("playerJoin", (event) => addPlayer(event.player)),
      emitter.on("playerLeave", (event) => removePlayer(event.player)),
      emitter.on("vote", (event) => vote(event.player, event.vote)),
      emitter.on("toggleVotesShown", (event) => setVotesVisible(event.shown)),
      emitter.on("syncState", (event) => syncFullState(event.gameState)),
      emitter.on("clearVotes", () => clearVotes()),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const sendVote = (vote: Vote) => {
    if (player) {
      messageSender?.send({
        event: "vote",
        player: player,
        vote: vote,
      });
    }
  };

  const sendSetVotesShown = (shown: boolean) => {
    messageSender?.send({
      event: "toggleVotesShown",
      shown: shown,
    });
  };

  const sendClearVotes = () => {
    messageSender?.send({
      event: "clearVotes",
    });
  };

  return {
    gameState,
    sendVote,
    sendSetVotesShown,
    sendClearVotes,
    self: player,
  };
}

function useHostPeer(roomId: string, gameState: GameState) {
  const [host, setHost] = useState<PeerJS.Peer | null>();
  const connectionsRef = useRef<Array<PeerJS.DataConnection>>([]);
  const gameStateRef = useRef<GameState>(gameState);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Create a new host when the roomId changes
  useEffect(() => {
    const hostPeer = new PeerJS.Peer(roomId);

    hostPeer.on("error", (error) => {
      if (error.type === "unavailable-id") {
        setHost(null);
        hostPeer.destroy();
      }
    });

    hostPeer.on("open", () => {
      setHost(hostPeer);

      const broadcast = (data: EventData) => {
        console.log("[Host] Broadcasting: ", data);
        connectionsRef.current.forEach((conn) => conn.send(data));
      };

      hostPeer.on("connection", (connection) => {
        connection.on("data", (data) => broadcast(data as EventData));

        connection.on("open", () => {
          console.log("[Host] Connection: ", connection);
          connectionsRef.current.push(connection);
          connection.send({
            event: "syncState",
            gameState: gameStateRef.current,
          } as EventData);
          broadcast({
            event: "playerJoin",
            player: {
              id: connection.peer,
              name: connection.metadata.name,
            },
          });
        });
        connection.on("close", () => {
          connectionsRef.current = connectionsRef.current.filter(
            (it) => it !== connection,
          );
          broadcast({
            event: "playerLeave",
            player: {
              id: connection.peer,
              name: connection.metadata.name,
            },
          });
        });
      });
    });

    return () => {
      console.log("[HOST] Cleanup");
      hostPeer.destroy();
      setHost(undefined);
      connectionsRef.current = [];
    };
  }, [roomId]);

  return { host };
}

function useClientPeer(
  roomId: string,
  name: string,
  hostPeer: PeerJS.Peer | null | undefined,
  emitter: Emittery<Events>,
) {
  const [peer, setPeer] = useState<PeerJS.Peer>();
  const [player, setPlayer] = useState<Player>();
  const [messageSender, setMessageSender] = useState<{
    send: (data: EventData) => void;
  }>();

  useEffect(() => {
    if (hostPeer === undefined) {
      // Host hasn't been determined yet, we can't connect to them
      return;
    }

    const clientPeer = new PeerJS.Peer();

    clientPeer.on("open", () => {
      const conn = clientPeer.connect(roomId, { metadata: { name } });

      conn.on("open", () => {
        console.log("[CLIENT] OPEN");

        setPeer(clientPeer);
        setPlayer({
          id: clientPeer.id,
          name: name,
        });
        setMessageSender({ send: (data) => conn.send(data) });

        conn.on("data", (data) => {
          console.log("[CLIENT] DATA: ", data);

          const event = data as unknown as EventData;
          emitter.emit(event.event, event);
        });
      });

      conn.on("close", () => {
        clientPeer.destroy();
        setPeer(undefined);
        setMessageSender(undefined);
      });
    });

    return () => {
      console.log("[CLIENT] CLEANUP");
      clientPeer.destroy();
      setPeer(undefined);
      setPlayer(undefined);
      setMessageSender(undefined);
    };
  }, [roomId, name, hostPeer, emitter]);

  return { messageSender, player };
}
