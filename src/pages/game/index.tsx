import Thonk from "@/assets/thonk.svg?react";
import { useAppForm } from "@/components/form-context";
import { PointButton, PointCard } from "@/components/point-card";
import { usePeerJsPointingGame } from "@/lib/peerjs-game";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import type { GameState } from "@/lib/game";
import { FaRegCopy } from "react-icons/fa";
import { Button } from "@/components/ui/button";

export const GamePage = () => {
  const [name, setName] = useState<string>();
  const [gameId, setGameId] = useState<string>();

  useEffect(() => {
    const params = Object.fromEntries(
      new URLSearchParams(window.location.search),
    );

    if (!params.gameId) {
      window.location.href = "/";
      return;
    }

    if (params.name) {
      const url = new URL(window.location.href);
      url.searchParams.delete("name");
      window.history.pushState({}, "", url);
    }

    setGameId(params.gameId);
    setName(params.name);
  }, []);

  return (
    <>
      <NameDialog open={!name} setName={setName} />
      {name && gameId ? <LiveGame name={name} gameId={gameId} /> : <MockGame />}
    </>
  );
};

export const NameDialog = (props: {
  open: boolean;
  setName: (name: string) => void;
}) => {
  const form = useAppForm({
    defaultValues: { name: "" },
    onSubmit: ({ value }) => props.setName(value.name),
  });

  return (
    <Dialog open={props.open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Your Name</DialogTitle>
          <DialogDescription>
            Please enter your name to join the session.
          </DialogDescription>
        </DialogHeader>
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="grid gap-2"
          >
            <form.AppField
              name="name"
              children={(field) => <field.TextField label="Name" />}
              validators={{
                onChange: ({ value }) => {
                  return value.length === 0 ? "Name is required" : undefined;
                },
              }}
            />
            <form.AppForm>
              <form.SubmitButton className="w-full" />
            </form.AppForm>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const LiveGame = ({
  name,
  gameId,
}: {
  name: string;
  gameId: string;
}) => {
  const { gameState, sendVote, sendSetVotesShown, sendClearVotes, self } =
    usePeerJsPointingGame(gameId, name);
  return (
    <Game
      gameState={gameState}
      sendVote={sendVote}
      sendSetVotesShown={sendSetVotesShown}
      sendClearVotes={sendClearVotes}
      self={self}
    />
  );
};

export const MockGame = () => {
  const mockGameState: GameState = {
    players: {
      "1": { name: "Holly", vote: 3 },
      "2": { name: "Flynn", vote: 5 },
      "3": { name: "Marie", vote: 5 },
      "4": { name: "Mike", vote: 2 },
    },
    votesVisible: true,
  };
  const mockSelf = { ...mockGameState.players["1"], id: "1" };

  return (
    <Game
      gameState={mockGameState}
      sendVote={() => {}}
      sendSetVotesShown={() => {}}
      sendClearVotes={() => {}}
      self={mockSelf}
    />
  );
};

export const Game = ({
  gameState,
  sendVote,
  sendSetVotesShown,
  sendClearVotes,
  self,
}: ReturnType<typeof usePeerJsPointingGame>) => {
  // Calculate vote statistics
  const votes = Object.values(gameState.players)
    .map((player) => player.vote)
    .filter((vote): vote is number => vote !== null);

  const voteAverage = votes.length
    ? (votes.reduce((sum, vote) => sum + vote, 0) / votes.length).toFixed(1)
    : "-";

  // Count votes for distribution
  const voteCounts: Record<number, number> = {};
  const possibleVotes = [1, 2, 3, 5, 8, 13];
  possibleVotes.forEach((v) => {
    voteCounts[v] = 0;
  });
  votes.forEach((vote) => {
    if (vote in voteCounts) voteCounts[vote]++;
  });

  // Find closest standard point value
  const closestPointValue = votes.length
    ? possibleVotes.reduce((closest, current) => {
        const avgNumber = parseFloat(voteAverage);
        return Math.abs(current - avgNumber) < Math.abs(closest - avgNumber)
          ? current
          : closest;
      }, possibleVotes[0])
    : "-";

  return (
    <>
      <div className="mx-auto flex h-screen max-w-5xl flex-col p-4">
        {/* Copy Session Link */}
        <div className="mb-4 flex items-center justify-center">
          <Button
            onClick={() => {
              const url = new URL(window.location.href);
              navigator.clipboard.writeText(url.toString());
            }}
            className="gap-2 transition-colors duration-300"
          >
            <FaRegCopy />
            Copy Session Link
          </Button>
        </div>

        {/* Vote buttons - at the top */}
        <div className="mb-4 rounded-lg bg-gray-100 p-4">
          <h2 className="mb-3 text-xl font-bold">Cast Your Vote</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {possibleVotes.map((value) => (
              <PointButton
                key={value}
                className="h-24"
                onClick={() => sendVote(value)}
              >
                {value}
              </PointButton>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 md:flex-row">
          {/* Players and their votes */}
          <div className="overflow-auto md:w-1/2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Players</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Object.values(gameState.players).map((player, index) => (
                <div key={index} className="relative p-2 text-center">
                  <PointCard
                    className={`relative mx-auto h-32 ${
                      player.vote !== null
                        ? "border-green-500 bg-green-300/10 shadow-[0px_0px_20px_rgba(0,0,0,0.25)] shadow-green-600/30"
                        : ""
                    }`}
                  >
                    {!gameState.votesVisible && player.vote !== null ? (
                      <span className="absolute top-0 right-0 -mt-1 -mr-1 flex size-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex size-3 rounded-full bg-green-500"></span>
                      </span>
                    ) : null}

                    {gameState.votesVisible ? (
                      player.vote !== null ? (
                        player.vote
                      ) : (
                        "-"
                      )
                    ) : player.vote !== null ? (
                      ""
                    ) : (
                      <Thonk className="size-10" />
                    )}
                  </PointCard>
                  <p className="mt-2 flex items-center justify-center gap-1">
                    {player.name}
                    {player.vote !== null && (
                      <span className="text-xs text-green-600">✓</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Vote Results */}
          <div className="md:w-1/2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Results</h2>
              <div className="flex gap-2">
                <button
                  className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
                  onClick={() => sendSetVotesShown(!gameState.votesVisible)}
                >
                  {gameState.votesVisible ? "Hide Votes 🙈" : "Show Votes 👀"}
                </button>
                <button
                  className="rounded bg-gray-300 px-4 py-2 text-sm hover:bg-gray-400"
                  onClick={sendClearVotes}
                >
                  Clear Votes
                </button>
              </div>
            </div>

            <div className="mb-6 flex flex-col md:flex-row md:gap-12">
              <div>
                <h2 className="text-xl font-bold">Vote Average</h2>
                <div className="mt-2 text-4xl font-bold">
                  {gameState.votesVisible ? voteAverage : "?"}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold">Closest Point Value</h2>
                <div className="mt-2 text-4xl font-bold">
                  {gameState.votesVisible ? closestPointValue : "?"}
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-bold">Vote Distribution</h2>
              <div className="space-y-2">
                {possibleVotes.map((value) => (
                  <div key={value} className="flex items-center">
                    <span className="w-8">{value}</span>
                    <div className="h-6 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`flex h-full items-center justify-end transition-[width] ${gameState.votesVisible && voteCounts[value] > 0 ? "bg-blue-500 px-2" : ""}`}
                        style={{
                          width: `${votes.length && gameState.votesVisible && voteCounts[value] > 0 ? (voteCounts[value] / votes.length) * 100 : 0}%`,
                        }}
                      >
                        {gameState.votesVisible && voteCounts[value] > 0 && (
                          <span className="text-xs font-medium text-white">
                            {voteCounts[value]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
