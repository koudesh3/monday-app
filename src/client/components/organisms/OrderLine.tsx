/**
 * OrderLine
 * A single order line (gift box) with 1 multi-select dropdown for 3 fragrances and inscription
 */

import React, { useState, useMemo } from 'react';
import { Heading, Text } from '@vibe/typography';
import { TextField, Flex, Box, Dropdown } from '@vibe/core';
import { IconButton } from '@vibe/icon-button';
import { Delete } from '@vibe/icons';
import { rules } from '../../validation';
import type { Fragrance } from '../../api/fragrances';
import type { OrderLine as OrderLineType } from '../../hooks/useOrderLines';

export interface OrderLineProps {
  box: OrderLineType;
  boxNumber: number;
  availableFragrances: Fragrance[];
  onFragrancesChange: (fragrances: Fragrance[]) => void;
  onInscriptionChange: (inscription: string) => void;
  onRemove?: () => void;
  slotsError?: string | null;
  inscriptionError?: string | null;
}

/**
 * Order line component (gift box configuration).
 * - 1 multi-select dropdown for selecting exactly 3 unique fragrances
 * - Fully controlled inscription field that syncs immediately to parent
 */
export function OrderLine({
  box,
  boxNumber,
  availableFragrances,
  onFragrancesChange,
  onInscriptionChange,
  onRemove,
  slotsError,
  inscriptionError,
}: OrderLineProps) {
  // Local error state for blur-time validation feedback
  const [localInscriptionError, setLocalInscriptionError] = useState<string | null>(null);

  // Validate inscription on blur for user feedback
  const handleInscriptionBlur = () => {
    const error = rules.inscription(box.inscription);
    setLocalInscriptionError(error);
  };

  // Dropdown options
  const options = useMemo(
    () =>
      availableFragrances.map((f) => ({
        value: f.id,
        label: f.name,
      })),
    [availableFragrances]
  );

  // Selected values for dropdown
  const selectedValues = useMemo(
    () => box.fragrances.map((f) => ({ value: f.id, label: f.name })),
    [box.fragrances]
  );

  // Handle fragrance selection change
  const handleFragranceChange = (selected: Array<{ value: string; label: string }>) => {
    // Limit to maximum 3 selections
    const limitedSelection = selected.slice(0, 3);

    // Ensure uniqueness with Set
    const uniqueIds = Array.from(new Set(limitedSelection.map((s) => s.value)));
    const selectedFragrances = uniqueIds
      .map((id) => availableFragrances.find((f) => f.id === id))
      .filter((f): f is Fragrance => f !== undefined);

    onFragrancesChange(selectedFragrances);
  };

  // Count filled fragrances
  const filledCount = box.fragrances.length;

  return (
    <Box border rounded="medium" backgroundColor="primaryBackgroundColor" padding="medium">
      <Box marginBottom="medium">
        <Flex align="center" gap="medium" justify="space-between">
          <Flex align="center" gap="medium">
            <Heading type="h3">Box {boxNumber}</Heading>
            <Text type="text3" color="secondary">
              {filledCount} / 3 fragrances
            </Text>
          </Flex>
          {onRemove && (
            <IconButton
              icon={Delete}
              size="small"
              kind="tertiary"
              ariaLabel={`Remove box ${boxNumber}`}
              onClick={onRemove}
            />
          )}
        </Flex>
      </Box>

      <Box marginBottom="medium">
        <Dropdown
          placeholder="Select 3 fragrances"
          value={selectedValues}
          options={options}
          onChange={handleFragranceChange}
          multi
          multiline
          size="medium"
          menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
        />
      </Box>

      {slotsError && (
        <Box marginBottom="small">
          <Text type="text3" color="negative">
            {slotsError}
          </Text>
        </Box>
      )}

      <TextField
        title="Inscription (optional)"
        placeholder="Enter inscription for this box"
        value={box.inscription}
        onChange={onInscriptionChange}
        onBlur={handleInscriptionBlur}
        validation={
          localInscriptionError || inscriptionError
            ? { status: 'error', text: localInscriptionError || inscriptionError }
            : undefined
        }
      />
    </Box>
  );
}
