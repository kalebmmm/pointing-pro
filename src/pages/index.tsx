import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppForm } from "@/components/form-context";
import { generateGameId, isValidGameId } from "@/lib/game-id";

export const HomePage = () => {
  const form = useAppForm({
    defaultValues: {
      name: "",
      gameId: "",
    },
    onSubmit: async ({ value }) => {
      let gameId = value.gameId.trim();

      if (!gameId) {
        gameId = await generateGameId();
      }

      window.location.href = `/game?gameId=${encodeURIComponent(gameId)}&name=${encodeURIComponent(value.name)}`;
    },
    validators: {
      onSubmitAsync: async ({ value }) => {
        const validGameId =
          !value.gameId.trim() || (await isValidGameId(value.gameId.trim()));

        if (!validGameId) {
          return {
            fields: {
              gameId: "Invalid Game ID",
            },
          };
        }
      },
    },
  });

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Pointing Poker</CardTitle>
          <CardDescription>
            Enter your name to create or join a game
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <div className="space-y-4">
              <form.AppField
                name="name"
                children={(field) => <field.TextField label="Name" />}
                validators={{
                  onChange: ({ value }) => {
                    return value.length === 0 ? "Name is required" : undefined;
                  },
                }}
              />

              <form.AppField
                name="gameId"
                children={(field) => <field.TextField label="Game ID" />}
              />

              <form.AppForm>
                <form.SubmitButton
                  label="Create or Join Game"
                  className="w-full"
                />
              </form.AppForm>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
