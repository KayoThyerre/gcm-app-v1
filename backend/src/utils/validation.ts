export const FIELD_LIMITS = {
  name: 100,
  email: 150,
  phone: 20,
  password: 128,
  newsTitle: 180,
  newsContent: 10000,
  imageUrl: 500,
  approachName: 150,
  cpf: 20,
  rg: 30,
  motherName: 150,
  notes: 2000,
  photoUrl: 500,
  scalePersonName: 150,
} as const;

export function validateMaxLength(
  value: unknown,
  fieldLabel: string,
  maxLength: number
) {
  if (typeof value === "string" && value.length > maxLength) {
    return `${fieldLabel} deve ter no maximo ${maxLength} caracteres.`;
  }

  return null;
}

export function validateStringArrayMaxLength(
  values: string[],
  fieldLabel: string,
  maxLength: number
) {
  const hasOversizedValue = values.some(
    (value) => value.length > maxLength
  );

  if (hasOversizedValue) {
    return `${fieldLabel} deve ter itens com no maximo ${maxLength} caracteres.`;
  }

  return null;
}
