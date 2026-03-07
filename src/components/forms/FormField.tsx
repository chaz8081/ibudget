import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { type TextInputProps } from "react-native";

type FormFieldProps<T extends FieldValues> = TextInputProps & {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  compact?: boolean;
};

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  compact,
  ...inputProps
}: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <Input
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
