import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { TextField, type TextFieldProps } from "@mui/material";
import { maskBRPhone } from "@/lib/formatters/phone";

type RHFPhoneFieldProps<T extends FieldValues> = Omit<
  TextFieldProps,
  "name" | "value" | "onChange" | "onBlur" | "error" | "inputRef" | "inputMode"
> & {
  name: FieldPath<T>;
  control: Control<T>;
};

export function RHFPhoneField<T extends FieldValues>({
  name,
  control,
  helperText,
  ...textFieldProps
}: RHFPhoneFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...textFieldProps}
          name={field.name}
          value={field.value ?? ""}
          onChange={(e) => field.onChange(maskBRPhone(e.target.value))}
          onBlur={field.onBlur}
          inputRef={field.ref}
          inputMode="tel"
          error={Boolean(error)}
          helperText={error?.message ?? helperText}
        />
      )}
    />
  );
}
