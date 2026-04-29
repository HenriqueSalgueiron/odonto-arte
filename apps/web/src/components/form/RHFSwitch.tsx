import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  FormControlLabel,
  Switch,
  type SwitchProps,
} from "@mui/material";
import type { ReactNode } from "react";

type RHFSwitchProps<T extends FieldValues> = Omit<
  SwitchProps,
  "name" | "checked" | "onChange" | "onBlur" | "inputRef"
> & {
  name: FieldPath<T>;
  control: Control<T>;
  label: ReactNode;
};

export function RHFSwitch<T extends FieldValues>({
  name,
  control,
  label,
  ...switchProps
}: RHFSwitchProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          control={
            <Switch
              {...switchProps}
              name={field.name}
              checked={Boolean(field.value)}
              onChange={(_, checked) => field.onChange(checked)}
              onBlur={field.onBlur}
              inputRef={field.ref}
            />
          }
          label={label}
        />
      )}
    />
  );
}
