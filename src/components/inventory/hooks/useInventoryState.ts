import { useState, useMemo } from 'react';
import { Ingredient } from '../../types';

type ModalType = 'add' | 'edit' | 'adjust' | 'delete' | null;

export function useInventoryState(ingredients: Ingredient[]) {
  // ── Filters ──
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Semua Bahan');

  // ── Modal ──
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Ingredient | null>(null);

  const openModal = (type: ModalType, ing?: Ingredient) => {
    setSelected(ing ?? null);
    setActiveModal(type);
  };
  const closeModal = () => {
    setActiveModal(null);
    setSelected(null);
  };

  // ── Derived ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ingredients.filter(ing => {
      const matchSearch =
        ing.name.toLowerCase().includes(q) ||
        ing.supplier.toLowerCase().includes(q);
      if (activeTab === 'Semua Bahan') return matchSearch;
      if (activeTab === 'Stok Kritis') return matchSearch && ing.stock <= ing.min_stock;
      return matchSearch && ing.category === activeTab;
    });
  }, [ingredients, search, activeTab]);

  const stats = useMemo(() => ({
    totalItem:   ingredients.length,
    totalNilai:  ingredients.reduce((acc, i) => acc + i.stock * i.unit_price, 0),
    kritisCount: ingredients.filter(i => i.stock <= i.min_stock).length,
    akanHabis:   ingredients.filter(i => i.stock <= i.min_stock * 1.5 && i.stock > i.min_stock).length,
  }), [ingredients]);

  return {
    // filters
    search, setSearch,
    activeTab, setActiveTab,
    // modal
    activeModal, selected,
    openModal, closeModal,
    // derived
    filtered, stats,
  };
}
