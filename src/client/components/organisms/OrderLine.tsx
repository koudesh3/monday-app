/**
 * OrderLine
 * A single order line (gift box) with 1 multi-select dropdown for 3 fragrances and inscription
 */

import React, { useState, useImperativeHandle, forwardRef, useMemo } from 'react';
import { Heading, Text } from '@vibe/typography';
import { TextField, Flex, Box as VibeBox, Dropdown } from '@vibe/core';
import { IconButton } from '@vibe/icon-button';
import { Delete } from '@vibe/icons';
import { rules } from '../../validation';
import type { Fragrance } from '../../api/fragrances';
import type { Box } from '../../hooks/useBoxes';

export interface OrderLineProps {
  box: Box;
  boxNumber: number;
  availableFragrances: Fragrance[];
  onFragrancesChange: (fragrances: Fragrance[]) => void;
  onInscriptionChange: (inscription: string) => void;
  onRemove?: () => void;
  slotsError?: string | null;
  inscriptionError?: string | null;
}

export interface OrderLineRef {
  value: string;
}

/**
 * Order line component (gift box configuration).
 * - 1 multi-select dropdown for selecting exactly 3 unique fragrances
 * - Inscription field with blur-based sync to parent
 * - Exposes inscription via ref for submission-time reading
 */
export const OrderLine = forwardRef<OrderLineRef, OrderLineProps>(
  (
    {
      box,
      boxNumber,
      availableFragrances,
      onFragrancesChange,
      onInscriptionChange,
      onRemove,
      slotsError,
      inscriptionError,
    },
    ref
  ) => {
    // Local inscription state for immediate updates
    const [localInscription, setLocalInscription] = useState(box.inscription);
    const [localInscriptionError, setLocalInscriptionError] = useState<string | null>(null);

    // Expose current inscription value via ref
    useImperativeHandle(ref, () => ({
      get value() {
        return localInscription;
      },
    }));

    // Flush inscription to parent on blur
    const handleInscriptionBlur = () => {
      const error = rules.inscription(localInscription);
      setLocalInscriptionError(error);
      onInscriptionChange(localInscription);
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
      // Limit to 3 selections with uniqueness enforced by Set
      const uniqueIds = Array.from(new Set(selected.map((s) => s.value))).slice(0, 3);
      const selectedFragrances = uniqueIds
        .map((id) => availableFragrances.find((f) => f.id === id))
        .filter((f): f is Fragrance => f !== undefined);

      onFragrancesChange(selectedFragrances);
    };

    // Count filled fragrances
    const filledCount = box.fragrances.length;
    const isComplete = filledCount === 3;

    return (
      <VibeBox border rounded="medium" backgroundColor="primaryBackgroundColor" padding="medium" style={{ width: '100%', position: 'relative' }}>
        {onRemove && (
          <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, color: 'var(--negative-color, #D83A52)' }}>
            <IconButton
              icon={Delete}
              size="small"
              kind="tertiary"
              ariaLabel={`Remove box ${boxNumber}`}
              onClick={onRemove}
            />
          </div>
        )}
        <VibeBox marginBottom="medium">
          <Flex align="center" gap="medium">
            <div>
              <Heading type="h3">Box {boxNumber}</Heading>
            </div>
            <Text type="text3" color="secondary">
              {filledCount} / 3 fragrances
            </Text>
          </Flex>
        </VibeBox>

        <VibeBox marginBottom="medium" style={{ width: '100%' }}>
          <Dropdown
            placeholder="Select 3 fragrances"
            value={selectedValues}
            options={options}
            onChange={handleFragranceChange}
            multi
            multiline
            size="medium"
          />
        </VibeBox>

        {slotsError && (
          <VibeBox marginBottom="small">
            <Text type="text3" color="negative">
              {slotsError}
            </Text>
          </VibeBox>
        )}

        <TextField
          title="Inscription (optional)"
          placeholder="Enter inscription for this box"
          value={localInscription}
          onChange={setLocalInscription}
          onBlur={handleInscriptionBlur}
          validation={
            localInscriptionError || inscriptionError
              ? { status: 'error', text: localInscriptionError || inscriptionError }
              : undefined
          }
        />
      </VibeBox>
    );
  }
);

OrderLine.displayName = 'OrderLine';
