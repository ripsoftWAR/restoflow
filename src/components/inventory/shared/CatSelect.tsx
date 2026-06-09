import React from 'react';
import { selectCls } from '../utils/styles';
import { DEFAULT_CATS } from '../utils/constants';
import { Ingredient } from '../../../types';

interface CatSelectProps {
  value: string;
  onChange: (v: string) => void;
  ingredients: Ingredient[];
}

export default function CatSelect({ value, onChange, ingredients }: CatSelectProps) {
  const existingCats = Array.from(new Set(ingredients.map(i => i.category))).filter(Boolean);
  const allCats = [...DEFAULT_CATS, ...existingCats.filter(c => !DEFAULT_CATS.includes(c as any))];

  return (
    <select className={selectCls} value={value} onChange={e => onChange(e.target.value)}>
      {allCats.map(c => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}
