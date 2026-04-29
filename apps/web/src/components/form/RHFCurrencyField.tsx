import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { TextField, type TextFieldProps } from "@mui/material";
import { maskBRL } from "@/lib/formatters/currency";

type RHFCurrencyFieldProps<T extends FieldValues> = Omit<
  TextFieldProps,
  "name" | "value" | "onChange" | "onBlur" | "error" | "inputRef" | "inputMode"
> & {
  name: FieldPath<T>;
  control: Control<T>;
};

export function RHFCurrencyField<T extends FieldValues>({
  name,
  control,
  helperText,
  ...textFieldProps
}: RHFCurrencyFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...textFieldProps}
          name={field.name}
          value={field.value ?? ""}
          onChange={(e) => field.onChange(maskBRL(e.target.value))}
          onBlur={field.onBlur}
          inputRef={field.ref}
          inputMode="decimal"
          error={Boolean(error)}
          helperText={error?.message ?? helperText}
        />
      )}
    />
  );
}
