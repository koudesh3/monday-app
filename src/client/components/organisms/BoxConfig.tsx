/**
 * BoxConfig
 * A single gift box configuration with 3 fragrance slots and inscription
 */

import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Heading, Text } from '@vibe/typography';
import { TextField, Flex, Box as VibeBox } from '@vibe/core';
import { IconButton } from '@vibe/icon-button';
import { Delete } from '@vibe/icons';
import { SlotPicker } from '../molecules/SlotPicker';
import { rules } from '../../validation';
import type { Fragrance } from '../../api/fragrances';
import type { Box } from '../../hooks/useBoxes';

export interface BoxConfigProps {
  box: Box;
  boxNumber: number;
  availableFragrances: Fragrance[];
  onSlotChange: (slotIndex: number, fragrance: Fragrance | null) => void;
  onInscriptionChange: (inscription: string) => void;
  onRemove?: () => void;
  slotsError?: string | null;
  inscriptionError?: string | null;
}

export interface BoxConfigRef {
  value: string;
}

/**
 * Gift box configuration component.
 * - 3 fragrance slots (prevents duplicates within the box)
 * - Inscription field with blur-based sync to parent
 * - Exposes inscription via ref for submission-time reading
 */
export const BoxConfig = forwardRef<BoxConfigRef, BoxConfigProps>(
  (
    {
      box,
      boxNumber,
      availableFragrances,
      onSlotChange,
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

    // Track which fragrances are already used in this box
    const usedIds = new Set(box.fragrances.filter(Boolean).map((f) => f!.id));

    // Count filled slots
    const filledCount = box.fragrances.filter(Boolean).length;
    const isComplete = filledCount === 3;

    return (
      <VibeBox
        border
        rounded="medium"
        backgroundColor="primaryBackgroundColor"
        style={{
          padding: '20px',
          borderColor: isComplete ? 'var(--positive-color)' : undefined,
          transition: 'border-color 0.15s ease',
        }}
      >
        <Flex align="center" gap="medium" style={{ marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <Heading type="h3">Box {boxNumber}</Heading>
          </div>
          <Text type="text3" color="secondary">
            {filledCount} / 3 fragrances
          </Text>
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

        <Flex direction="column" gap="medium" style={{ marginBottom: '16px' }}>
          {box.fragrances.map((fragrance, slotIndex) => (
            <SlotPicker
              key={slotIndex}
              fragrance={fragrance}
              availableFragrances={availableFragrances}
              usedIds={usedIds}
              onSelect={(f) => onSlotChange(slotIndex, f)}
              onRemove={() => onSlotChange(slotIndex, null)}
              slotNumber={slotIndex + 1}
            />
          ))}
        </Flex>

        {slotsError && (
          <Text type="text3" color="negative" style={{ marginBottom: '12px' }}>
            {slotsError}
          </Text>
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

BoxConfig.displayName = 'BoxConfig';
