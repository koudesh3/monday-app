/**
 * OrderForm
 * Main form layout for creating production orders
 */

import React from 'react';
import { Heading, Text } from '@vibe/typography';
import { TextField, Flex, Box as VibeBox } from '@vibe/core';
import { Button } from '@vibe/button';
import { IconButton } from '@vibe/icon-button';
import { Settings } from '@vibe/icons';
import { BoxConfig, BoxConfigRef } from './BoxConfig';
import type { Fragrance } from '../../api/fragrances';
import type { Box } from '../../hooks/useBoxes';

export interface OrderFormProps {
  firstName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  boxes: Box[];
  availableFragrances: Fragrance[];
  onSlotChange: (boxIndex: number, slotIndex: number, fragrance: Fragrance | null) => void;
  onInscriptionChange: (boxIndex: number, inscription: string) => void;
  onAddBox: () => void;
  onRemoveBox: (index: number) => void;
  onSubmit: () => void;
  onOpenAdmin: () => void;
  canSubmit: boolean;
  submitting: boolean;
  submitError: string | null;
  firstNameError?: string | null;
  lastNameError?: string | null;
  boxesError?: string | null;
  boxErrors?: Array<{ slots?: string; inscription?: string } | null>;
  inscriptionRefs: React.MutableRefObject<(BoxConfigRef | null)[]>;
}

/**
 * Order form with name fields, box configurations, and submit button.
 * Uses <form> element for semantics and accessibility.
 * Submit button is type="submit", all others are type="button".
 */
export function OrderForm({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  boxes,
  availableFragrances,
  onSlotChange,
  onInscriptionChange,
  onAddBox,
  onRemoveBox,
  onSubmit,
  onOpenAdmin,
  canSubmit,
  submitting,
  submitError,
  firstNameError,
  lastNameError,
  boxesError,
  boxErrors,
  inscriptionRefs,
}: OrderFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <VibeBox
        backgroundColor="primaryBackgroundColor"
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '24px',
        }}
      >
        <Flex direction="column" style={{ gap: '32px' }}>
          <Flex
            align="center"
            justify="space-between"
            style={{
              paddingBottom: '16px',
              borderBottom: '1px solid var(--ui-border-color)',
            }}
          >
            <Heading type="h1">New Production Order</Heading>
            <IconButton
              icon={Settings}
              kind="tertiary"
              ariaLabel="Manage fragrances"
              onClick={onOpenAdmin}
            />
          </Flex>

          <Flex direction="column" gap="medium">
            <Heading type="h2">Order Name</Heading>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}
            >
              <TextField
                title="First Name"
                placeholder="Enter first name"
                value={firstName}
                onChange={onFirstNameChange}
                validation={firstNameError ? { status: 'error', text: firstNameError } : undefined}
                required
              />
              <TextField
                title="Last Name"
                placeholder="Enter last name"
                value={lastName}
                onChange={onLastNameChange}
                validation={lastNameError ? { status: 'error', text: lastNameError } : undefined}
                required
              />
            </div>
          </Flex>

          <Flex direction="column" gap="medium">
            <Flex align="center" gap="medium">
              <div style={{ flex: 1 }}>
                <Heading type="h2">Gift Boxes</Heading>
              </div>
              <Text type="text3" color="secondary">
                {boxes.length} {boxes.length === 1 ? 'box' : 'boxes'}
              </Text>
              <Button type="button" kind="secondary" size="small" onClick={onAddBox}>
                Add Box
              </Button>
            </Flex>

            {boxesError && (
              <VibeBox
                rounded="medium"
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--primary-background-hover-color)',
                }}
              >
                <Text type="text2" color="negative">
                  {boxesError}
                </Text>
              </VibeBox>
            )}

            <Flex direction="column" gap="medium">
              {boxes.map((box, index) => (
                <BoxConfig
                  key={index}
                  ref={(el) => (inscriptionRefs.current[index] = el)}
                  box={box}
                  boxNumber={index + 1}
                  availableFragrances={availableFragrances}
                  onSlotChange={(slotIndex, fragrance) => onSlotChange(index, slotIndex, fragrance)}
                  onInscriptionChange={(inscription) => onInscriptionChange(index, inscription)}
                  onRemove={boxes.length > 1 ? () => onRemoveBox(index) : undefined}
                  slotsError={boxErrors?.[index]?.slots}
                  inscriptionError={boxErrors?.[index]?.inscription}
                />
              ))}
            </Flex>
          </Flex>

          <Flex
            direction="column"
            align="center"
            gap="medium"
            style={{
              paddingTop: '16px',
              borderTop: '1px solid var(--ui-border-color)',
            }}
          >
            {submitError && (
              <VibeBox
                rounded="medium"
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--primary-background-hover-color)',
                  textAlign: 'center',
                }}
              >
                <Text type="text2" color="negative">
                  {submitError}
                </Text>
              </VibeBox>
            )}
            <Button
              type="submit"
              kind="primary"
              size="large"
              disabled={!canSubmit}
              loading={submitting}
            >
              {submitting ? 'Submitting Order...' : 'Submit Order'}
            </Button>
          </Flex>
        </Flex>
      </VibeBox>
    </form>
  );
}
