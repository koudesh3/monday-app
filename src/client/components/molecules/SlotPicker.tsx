/**
 * SlotPicker
 * A single fragrance slot within a box
 * Two states: empty (dashed button) or filled (card with remove button)
 */

import React, { useState } from 'react';
import { Text } from '@vibe/typography';
import { Search, Flex, Box, useHover } from '@vibe/core';
import { IconButton } from '@vibe/icon-button';
import { Dialog, DialogContentContainer } from '@vibe/dialog';
import { EmptyState } from '@vibe/core';
import { Close, NavigationChevronDown } from '@vibe/icons';
import { FragranceRow } from './FragranceRow';
import { CategoryDot } from '../atoms/CategoryDot';
import { useSearch } from '../../hooks/useSearch';
import type { Fragrance } from '../../api/fragrances';

export interface SlotPickerProps {
  fragrance: Fragrance | null;
  availableFragrances: Fragrance[];
  usedIds: Set<string>;
  onSelect: (fragrance: Fragrance) => void;
  onRemove: () => void;
  slotNumber: number;
}

/**
 * Fragrance slot picker with two visual states:
 * - Empty: dashed border button with placeholder, opens picker dropdown
 * - Filled: colored card showing selected fragrance with remove button
 *
 * Picker dropdown uses Dialog for positioning with Search + FragranceRow list
 */
export function SlotPicker({
  fragrance,
  availableFragrances,
  usedIds,
  onSelect,
  onRemove,
  slotNumber,
}: SlotPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [emptyButtonRef, isEmptyButtonHovered] = useHover<HTMLButtonElement>();

  // Filter out fragrances already used in this box
  const selectableFragrances = availableFragrances.filter(
    (f) => !usedIds.has(f.id) || f.id === fragrance?.id
  );

  const { query, setQuery, filtered } = useSearch(selectableFragrances, [
    'name',
    'description',
    'category',
  ]);

  const handleSelect = (selected: Fragrance) => {
    onSelect(selected);
    setQuery('');
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  // Empty state
  if (!fragrance) {
    return (
      <div>
        <Dialog
          open={isOpen}
          showTrigger={[]}
          hideTrigger={['clickoutside', 'esckey']}
          onDialogDidHide={handleClose}
          content={() => (
            <DialogContentContainer>
              <Box border rounded="medium" backgroundColor="primaryBackgroundColor">
                <Search
                  placeholder="Search fragrances"
                  value={query}
                  onChange={setQuery}
                  autoFocus
                />

                <div>
                  {filtered.length === 0 ? (
                    <EmptyState
                      description={query ? 'No fragrances found' : 'No fragrances available'}
                    />
                  ) : (
                    filtered.map((f) => (
                      <FragranceRow
                        key={f.id}
                        fragrance={f}
                        mode="selectable"
                        onSelect={handleSelect}
                      />
                    ))
                  )}
                </div>
              </Box>
            </DialogContentContainer>
          )}
        >
          <button
            ref={emptyButtonRef}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={`Select fragrance for slot ${slotNumber}`}
          >
            <NavigationChevronDown />
            <Text type="text3" color="secondary">
              Select fragrance {slotNumber}
            </Text>
          </button>
        </Dialog>
      </div>
    );
  }

  // Filled state
  return (
    <Box border rounded="medium" backgroundColor="primaryBackgroundColor" padding="small">
      <Flex align="center" justify="space-between" gap="medium">
        <Flex align="start" gap="small">
          <CategoryDot category={fragrance.category} />
          <Box>
            <Text type="text2" weight="medium" ellipsis>
              {fragrance.name}
            </Text>
            {fragrance.description && (
              <Text type="text3" color="secondary" ellipsis>
                {fragrance.description}
              </Text>
            )}
          </Box>
        </Flex>
        <IconButton
          icon={Close}
          size="small"
          kind="tertiary"
          ariaLabel="Remove fragrance"
          onClick={handleRemove}
        />
      </Flex>
    </Box>
  );
}
