import React from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { type TextInputProps, type TextInput } from "react-native";

type FormFieldProps<T extends FieldValues> = TextInputProps & {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  compact?: boolean;
  inputRef?: React.RefObject<TextInput | null>;
};

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  compact,
  inputRef,
  ...inputProps
}: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <Input
          ref={inputRef}
          label={label}
          error={error?.message}
          compact={compact}
          onBlur={onBlur}
          onChangeText={onChange}
          value={value}
          {...inputProps}
        />
      )}
    />
  );
}
