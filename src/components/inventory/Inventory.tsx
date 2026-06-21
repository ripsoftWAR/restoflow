import React, { useState } from 'react';
import { Ingredient } from '../../types';
import { useInventoryState } from './hooks/useInventoryState';
import StatCards from './components/StatCards';
import MidRow from './components/MidRow';
import TableSection from './components/TableSection';
import RightSidebar from './components/RightSidebar';
import AddModal from './modals/AddModal';
import EditModal from './modals/EditModal';
import AdjustModal from './modals/AdjustModal';
import DeleteModal from './modals/DeleteModal';

interface InventoryProps {
  ingredients: Ingredient[];
  onAddIngredient: (data: any) => Promise<void>;
  onEditIngredient: (id: number, data: any) => Promise<void>;
  onAdjustStock: (id: number, finalStock: number, notes: string) => Promise<void>;
  onDeleteIngredient: (id: number) => Promise<void>;
  forceFullscreen?: boolean;
}

export default function Inventory({
  ingredients,
  onAddIngredient,
  onEditIngredient,
  onAdjustStock,
  onDeleteIngredient,
  forceFullscreen = false,
}: InventoryProps) {
  const [isFullscreenState, setIsFullscreenState] = useState(false);
  const isFullscreen = forceFullscreen || isFullscreenState;
  const {
    search, setSearch,
    activeTab, setActiveTab,
    statusFilter, setStatusFilter,
    activeModal, selected,
    openModal, closeModal,
    filtered, stats,
  } = useInventoryState(ingredients);

  const toggleFullscreen = () => {
    setIsFullscreenState(!isFullscreenState);
  };

  return (
    <>
      <div
        className={
          forceFullscreen
            ? 'min-h-full w-full bg-transparent p-3 sm:p-4'
            : isFullscreen
              ? 'absolute inset-0 z-40 bg-slate-50 p-3 sm:p-4 overflow-hidden'
              : 'min-h-full w-full bg-transparent p-3 sm:p-4'
        }
      >
        <div className="flex flex-col gap-4 min-h-0 xl:flex-row xl:items-start">

          {/* ── Left: main content ── */}
          <div className="w-full min-w-0 flex flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto">
            {!isFullscreen && (
              <>
                <StatCards ingredients={ingredients} />
                <MidRow
                  ingredients={ingredients}
                  totalItem={stats.totalItem}
                  kritisCount={stats.kritisCount}
                />
              </>
            )}

            <TableSection
              filtered={filtered}
              totalItem={stats.totalItem}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              onAdjust={(ing: Ingredient) => openModal('adjust', ing)}
              onEdit={(ing: Ingredient) => openModal('edit', ing)}
              onDelete={(ing: Ingredient) => openModal('delete', ing)}
              onAddClick={() => openModal('add')}
              search={search}
              onSearchChange={setSearch}
            />
          </div>

          {/* ── Right: sidebar ── */}
          {!isFullscreen && (
            <div className="w-full xl:w-72 xl:flex-shrink-0">
              <RightSidebar
                ingredients={ingredients}
                totalItem={stats.totalItem}
                onAddClick={() => openModal('add')}
                onAdjustFirstClick={() => {
                  const first = ingredients[0];
                  if (first) openModal('adjust', first);
                }}
                isFullscreen={isFullscreen}
                toggleFullscreen={toggleFullscreen}
              />
            </div>
          )}
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
