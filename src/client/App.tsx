/**
 * App
 * Top-level orchestrator that wires all hooks and components together
 */

import React, { useState, useRef, useCallback } from 'react';
import { Loader } from '@vibe/loader';
import { Toast, Flex } from '@vibe/core';
import { Heading, Text } from '@vibe/typography';
import { useMondayContext } from './hooks/useMondayContext';
import { useFragrances } from './hooks/useFragrances';
import { useBoxes } from './hooks/useBoxes';
import { useOrder } from './hooks/useOrder';
import { validateOrder } from './validation';
import { OrderForm } from './components/organisms/OrderForm';
import { SuccessScreen } from './components/organisms/SuccessScreen';
import { AdminPanel } from './components/organisms/AdminPanel';
import type { BoxConfigRef } from './components/organisms/BoxConfig';
import type { ValidationErrors } from './validation';

export default function App() {
  // Monday SDK initialization
  const { boardId, ready, error: mondayError } = useMondayContext();

  // Domain state
  const { fragrances, loading: fragrancesLoading, add, update, remove } = useFragrances();
  const { boxes, addBox, removeBox, setSlot, clearFragranceFromAll, allComplete } = useBoxes();
  const { submitting, submitted, error: submitError, response, submit, reset } = useOrder();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors | null>(null);

  // Inscription refs for submission-time reading
  const inscriptionRefs = useRef<(BoxConfigRef | null)[]>([]);

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'positive' | 'negative';
    open: boolean;
  }>({ message: '', type: 'positive', open: false });

  // Derived: can submit if basic presence checks pass
  const canSubmit =
    !!firstName.trim() &&
    !!lastName.trim() &&
    boxes.length > 0 &&
    allComplete &&
    !submitting &&
    boardId !== null;

  // Handle order submission
  const handleSubmit = useCallback(() => {
    if (!boardId) return;

    // Read current inscriptions from refs (source of truth at submission time)
    const currentBoxes = boxes.map((box, i) => ({
      ...box,
      inscription: inscriptionRefs.current[i]?.value ?? box.inscription,
    }));

    // Validate
    const errors = validateOrder({ firstName, lastName, boxes: currentBoxes });
    if (errors) {
      setValidationErrors(errors);
      setToast({
        message: 'Please fix validation errors before submitting',
        type: 'negative',
        open: true,
      });
      return;
    }

    // Clear validation errors
    setValidationErrors(null);

    // Build payload
    submit({
      boardId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      boxes: currentBoxes.map((box) => ({
        inscription: box.inscription,
        fragrance_ids: box.fragrances.map((f) => f!.id) as [string, string, string],
      })),
    });
  }, [boardId, boxes, firstName, lastName, submit]);

  // Handle fragrance CRUD with error handling
  const handleAddFragrance = useCallback(
    async (form: any) => {
      try {
        await add(form);
        setToast({ message: 'Fragrance added successfully', type: 'positive', open: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add fragrance';
        setToast({ message, type: 'negative', open: true });
        throw err;
      }
    },
    [add]
  );

  const handleUpdateFragrance = useCallback(
    async (id: string, form: any) => {
      try {
        await update(id, form);
        setToast({ message: 'Fragrance updated successfully', type: 'positive', open: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update fragrance';
        setToast({ message, type: 'negative', open: true });
        throw err;
      }
    },
    [update]
  );

  const handleDeleteFragrance = useCallback(
    async (id: string) => {
      try {
        await remove(id);
        clearFragranceFromAll(id);
        setToast({ message: 'Fragrance deleted successfully', type: 'positive', open: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete fragrance';
        setToast({ message, type: 'negative', open: true });
        throw err;
      }
    },
    [remove, clearFragranceFromAll]
  );

  // Handle new order
  const handleNewOrder = useCallback(() => {
    reset();
    setFirstName('');
    setLastName('');
    setValidationErrors(null);
    // useBoxes will maintain its state, but we could reset it if needed
  }, [reset]);

  // Show submission error toast
  if (submitError && !toast.open) {
    setToast({ message: submitError, type: 'negative', open: true });
  }

  // Loading state: Monday context initializing
  if (!ready && !mondayError) {
    return (
      <Flex
        align="center"
        justify="center"
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--primary-background-hover-color)',
        }}
      >
        <Loader size="large" />
      </Flex>
    );
  }

  // Error state: Monday context failed
  if (mondayError) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="medium"
        style={{
          minHeight: '100vh',
          padding: '24px',
          textAlign: 'center',
          backgroundColor: 'var(--primary-background-hover-color)',
        }}
      >
        <Heading type="h1" style={{ color: 'var(--negative-color)', margin: 0 }}>
          Initialization Error
        </Heading>
        <Text type="text1" color="secondary" style={{ margin: 0, maxWidth: '500px' }}>
          {mondayError}
        </Text>
        <Text type="text2" color="secondary" style={{ margin: 0, maxWidth: '500px' }}>
          Please ensure this app is running inside the Monday.com iframe.
        </Text>
      </Flex>
    );
  }

  // Loading state: Fragrances loading
  if (fragrancesLoading) {
    return (
      <Flex
        align="center"
        justify="center"
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--primary-background-hover-color)',
        }}
      >
        <Loader size="large" />
      </Flex>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--primary-background-hover-color)' }}>
      {/* Main content: Order form or success screen */}
      {submitted && response ? (
        <SuccessScreen
          boxCount={boxes.length}
          itemId={response.itemId}
          onNewOrder={handleNewOrder}
        />
      ) : (
        <OrderForm
          onOpenAdmin={() => {
            console.log('Settings button clicked, opening admin panel');
            setShowAdmin(true);
          }}
          firstName={firstName}
          lastName={lastName}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          boxes={boxes}
          availableFragrances={fragrances}
          onSlotChange={setSlot}
          onInscriptionChange={(boxIndex, inscription) => {
            const updatedBox = { ...boxes[boxIndex], inscription };
            const updatedBoxes = [...boxes];
            updatedBoxes[boxIndex] = updatedBox;
          }}
          onAddBox={addBox}
          onRemoveBox={removeBox}
          onSubmit={handleSubmit}
          canSubmit={canSubmit}
          submitting={submitting}
          submitError={submitError}
          firstNameError={validationErrors?.firstName}
          lastNameError={validationErrors?.lastName}
          boxesError={validationErrors?.boxes}
          boxErrors={validationErrors?.boxErrors}
          inscriptionRefs={inscriptionRefs}
        />
      )}

      {/* Admin panel modal */}
      <AdminPanel
        open={showAdmin}
        onClose={() => setShowAdmin(false)}
        fragrances={fragrances}
        onAdd={handleAddFragrance}
        onUpdate={handleUpdateFragrance}
        onDelete={handleDeleteFragrance}
      />

      {/* Toast notifications */}
      {toast.open && (
        <Toast
          open
          type={toast.type}
          onClose={() => setToast({ ...toast, open: false })}
          autoHideDuration={3000}
        >
          {toast.message}
        </Toast>
      )}
    </div>
  );
}
