// src/utils/mathHelper.ts

export const preciseMultiply = (a: number, b: number): number =>
  parseFloat((a * b).toFixed(2));

export const preciseAdd = (a: number, b: number): number =>
  parseFloat((a + b).toFixed(2));
