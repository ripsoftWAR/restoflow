import React from 'react';
import { Ingredient } from '../types';
import { useInventoryState } from './hooks/useInventoryState';
import {
  StatCards,
  MidRow,
  TableSection,
  RightSidebar,
  AddModal,
  EditModal,
  AdjustModal,
  DeleteModal,
} from './components';

interface InventoryProps {
  ingredients: Ingredient[];
  onAddIngredient: (data: any) => Promise<void>;
  onEditIngredient: (id: number, data: any) => Promise<void>;
  onAdjustStock: (id: number, finalStock: number, notes: string) => Promise<void>;
  onDeleteIngredient: (id: number) => Promise<void>;
}

export default function Inventory({
  ingredients,
  onAddIngredient,
  onEditIngredient,
  onAdjustStock,
  onDeleteIngredient,
}: InventoryProps) {
  const {
    search, setSearch,
    activeTab, setActiveTab,
    activeModal, selected,
    openModal, closeModal,
    filtered, stats,
  } = useInventoryState(ingredients);

  return (
    <>
      <div className="min-h-full w-full bg-transparent p-4">
        <div className="flex gap-4 min-h-0">

          {/* ── Left: main content ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-y-auto">
            <StatCards ingredients={ingredients} />

            <MidRow
              ingredients={ingredients}
              totalItem={stats.totalItem}
              kritisCount={stats.kritisCount}
            />

            <TableSection
              filtered={filtered}
              totalItem={stats.totalItem}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onAdjust={ing => openModal('adjust', ing)}
              onEdit={ing => openModal('edit', ing)}
              onDelete={ing => openModal('delete', ing)}
            />
          </div>

          {/* ── Right: sidebar ── */}
          <RightSidebar
            ingredients={ingredients}
            totalItem={stats.totalItem}
            onAddClick={() => openModal('add')}
            onAdjustFirstClick={() => {
              const first = ingredients[0];
              if (first) openModal('adjust', first);
            }}
          />
        </div>
      </div>

      {/* ── Modals ── */}
      {activeModal === 'add' && (
        <AddModal
          ingredients={ingredients}
          onClose={closeModal}
          onAddIngredient={onAddIngredient}
        />
      )}

      {activeModal === 'edit' && selected && (
        <EditModal
          ingredient={selected}
          ingredients={ingredients}
          onClose={closeModal}
          onEditIngredient={onEditIngredient}
        />
      )}

      {activeModal === 'adjust' && selected && (
        <AdjustModal
          ingredient={selected}
          onClose={closeModal}
          onAdjustStock={onAdjustStock}
        />
      )}

      {activeModal === 'delete' && selected && (
        <DeleteModal
          ingredient={selected}
          onClose={closeModal}
          onDeleteIngredient={onDeleteIngredient}
        />
      )}
    </>
  );
}
