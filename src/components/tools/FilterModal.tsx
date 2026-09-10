import React from 'react';
import { X, Sliders, Check } from 'lucide-react';
import { FilterType } from '../../types';
import { FILTER_OPTIONS, getFilterCss } from '../../utils/filterStyles';

interface FilterModalProps {
  currentFilter: FilterType;
  onClose: () => void;
  onSelectFilter: (filter: FilterType) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  currentFilter,
  onClose,
  onSelectFilter,
}) => {
  return (
    <div className="bg-neutral-900 border-t border-neutral-800 p-4 shadow-2xl z-30 select-none animate-in slide-in-from-bottom duration-200">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-neutral-100 font-semibold text-sm">
            <Sliders className="w-4 h-4 text-pink-400" />
            <span>Video Color Filter</span>
          </div>
          <button
            id="filter-close-btn"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-3">
          <div className="grid grid-cols-4 gap-2.5">
            {FILTER_OPTIONS.map((f) => {
              const isSelected = currentFilter === f.id;
              const filterCss = getFilterCss(f.id);

              return (
                <button
                  key={f.id}
                  id={`filter-btn-${f.id}`}
                  onClick={() => onSelectFilter(f.id)}
                  className={`flex flex-col items-center p-2 rounded-xl border transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-pink-500/20 border-pink-400 ring-1 ring-pink-400/50 shadow-md shadow-pink-950/40'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  {/* Miniature color gradient swatch */}
                  <div
                    style={{ filter: filterCss }}
                    className="w-10 h-10 rounded-lg mb-1.5 bg-gradient-to-tr from-amber-600 via-rose-500 to-indigo-600 shadow-inner flex items-center justify-center"
                  >
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                  </div>
                  <span className="text-[11px] font-medium truncate w-full text-center">
                    {f.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2">
          <button
            id="filter-done-btn"
            onClick={onClose}
            className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-medium text-xs rounded-lg transition"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
};
