import { useState } from 'react';
import { Ingredient, RecipeWithDetails } from '../../../types';

export interface CustomOption {
  name: string;
  choices: string;
}

export interface RecipeLine {
  ingredient_id: number;
  amount: number;
}

export function useRecipeState(ingredients: Ingredient[]) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Semua Menu');

  // Form state
  const [menuName, setMenuName] = useState('');
  const [menuCategory, setMenuCategory] = useState('Makanan');
  const [menuPrice, setMenuPrice] = useState('0');
  const [spiceLevelOption, setSpiceLevelOption] = useState(false);
  const [sugarLevelOption, setSugarLevelOption] = useState(false);
  const [customOptionsList, setCustomOptionsList] = useState<CustomOption[]>([]);
  const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([]);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setMenuName('');
    setMenuCategory('Makanan');
    setMenuPrice('0');
    setSpiceLevelOption(false);
    setSugarLevelOption(false);
    setCustomOptionsList([]);
    setRecipeLines([{ ingredient_id: ingredients[0]?.id || 0, amount: 50 }]);
    setError('');
  };

  const openBuilder = (recipe?: RecipeWithDetails) => {
    if (recipe) {
      setMenuName(recipe.menu_name);
      setMenuCategory(recipe.category || 'Makanan');
      setMenuPrice(recipe.price?.toString() ?? '0');
      setSpiceLevelOption(recipe.spice_level_option === 1);
      setSugarLevelOption(recipe.sugar_level_option === 1);
      setRecipeLines(recipe.items.map((i: any) => ({ ingredient_id: i.ingredient_id, amount: i.amount })));
      try {
        setCustomOptionsList(recipe.custom_options ? JSON.parse(recipe.custom_options) : []);
      } catch {
        setCustomOptionsList([]);
      }
    } else {
      resetForm();
    }
    setShowBuilder(true);
  };

  const closeBuilder = () => {
    setShowBuilder(false);
    setError('');
  };

  // Line handlers
  const handleAddLine = () => {
    if (!ingredients.length) return;
    setRecipeLines(prev => [...prev, { ingredient_id: ingredients[0].id, amount: 10 }]);
  };

  const handleRemoveLine = (idx: number) => {
    setRecipeLines(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: 'ingredient_id' | 'amount', value: any) => {
    setRecipeLines(prev => {
      const updated = [...prev];
      if (field === 'ingredient_id') updated[idx].ingredient_id = parseInt(value);
      else updated[idx].amount = parseFloat(value) || 0;
      return updated;
    });
  };

  return {
    // UI state
    showBuilder, search, setSearch, activeTab, setActiveTab,
    // Form
    menuName, setMenuName,
    menuCategory, setMenuCategory,
    menuPrice, setMenuPrice,
    spiceLevelOption, setSpiceLevelOption,
    sugarLevelOption, setSugarLevelOption,
    customOptionsList, setCustomOptionsList,
    recipeLines, setRecipeLines,
    // Feedback
    success, setSuccess, error, setError, isSubmitting, setIsSubmitting,
    // Actions
    openBuilder, closeBuilder,
    handleAddLine, handleRemoveLine, handleLineChange,
  };
}
