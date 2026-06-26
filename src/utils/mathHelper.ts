// src/utils/mathHelper.ts
export const preciseMultiply = (a: number, b: number): number => {
  if (isNaN(a) || isNaN(b)) throw new Error("Input must be a number");
  return parseFloat((a * b).toFixed(3)); // 3 desimal untuk inventori
};

export const preciseAdd = (a: number, b: number): number => {
  if (isNaN(a) || isNaN(b)) throw new Error("Input must be a number");
  return parseFloat((a + b).toFixed(3));
};

export const validatePositive = (value: number): void => {
  if (value < 0) throw new Error("Value cannot be negative");
};