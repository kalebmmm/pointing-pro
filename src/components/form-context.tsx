import { cn } from "@/lib/utils";
import {
  createFormHook,
  createFormHookContexts,
  useStore,
} from "@tanstack/react-form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const TextField = (props: { label: string; className?: string }) => {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div className="grid gap-2">
      <Label htmlFor={field.name}>{props.label}</Label>
      <Input
        id={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        className={cn(
          errors.length ? "border-destructive" : "",
          props.className ?? "",
        )}
      />
      {errors.map((error) => (
        <div key={error} className="text-destructive text-sm">
          {error}
        </div>
      ))}
    </div>
  );
};

const SubmitButton = (props: { label?: string; className?: string }) => {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => {
        const disabled = !canSubmit || isSubmitting;
        return (
          <Button
            type="submit"
            disabled={disabled}
            aria-disabled={disabled}
            className={cn(
              `w-full ${disabled ? "opacity-50" : ""}`,
              props.className ?? "",
            )}
          >
            {props.label ?? "Submit"}
          </Button>
        );
      }}
    </form.Subscribe>
  );
};

const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField },
  formComponents: { SubmitButton },
});
