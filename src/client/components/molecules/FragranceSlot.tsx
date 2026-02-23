/**
 * FragranceSlot
 * Multi-select dropdown for selecting fragrances
 */

import React, { useMemo } from 'react';
import { Dropdown } from '@vibe/core';
import type { Fragrance } from '../../api/fragrances';

export interface FragranceSlotProps {
  fragrance: Fragrance | null;
  availableFragrances: Fragrance[];
  usedIds: Set<string>;
  onSelect: (fragrance: Fragrance) => void;
  onRemove: () => void;
  slotNumber: number;
}

/**
 * Fragrance slot picker using multi-select dropdown
 */
export function FragranceSlot({
  fragrance,
  availableFragrances,
  usedIds,
  onSelect,
  onRemove,
  slotNumber,
}: FragranceSlotProps) {
  const options = useMemo(
    () =>
      availableFragrances.map((f) => ({
        value: f.id,
        label: f.name,
      })),
    [availableFragrances]
  );

  return (
    <div style={{ width: '350px', marginBottom: '50px' }}>
      <Dropdown
        placeholder={`Select fragrance ${slotNumber}`}
        defaultValue={fragrance ? [{ value: fragrance.id, label: fragrance.name }] : []}
        options={options}
        multi
        clearAriaLabel="Clear"
      />
    </div>
  );
}
