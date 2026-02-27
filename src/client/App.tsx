/**
 * App
 * Top-level orchestrator that wires all hooks and components together
 */

import React, { useState, useCallback } from 'react';
import { Loader } from '@vibe/loader';
import { Toast, Flex } from '@vibe/core';
import { Heading, Text } from '@vibe/typography';
import { useMondayContext } from './hooks/useMondayContext';
import { useFragrances } from './hooks/useFragrances';
import { useOrderLines } from './hooks/useOrderLines';
import { useOrder } from './hooks/useOrder';
import { validateOrder } from './validation';
import { OrderForm, CustomerInfo } from './components/organisms/OrderForm';
import { OrderConfirmation } from './components/organisms/OrderConfirmation';
import { FragranceEditor } from './components/organisms/FragranceEditor';
import type { ValidationErrors } from './validation';
import type { FragranceForm } from './api/fragrances';

export default function App() {
  // Monday SDK initialization
  const { boardId, ready, error: mondayError } = useMondayContext();

  // Domain state
  const { fragrances, loading: fragrancesLoading, add, update, remove } = useFragrances(ready);
  const { boxes, addBox, removeBox, setFragrances, setInscription, clearFragranceFromAll, allComplete } = useOrderLines();
  const { submitting, submitted, error: submitError, response, submit, reset } = useOrder();

  // Form state
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    shippingAddress: '',
  });
  const [showAdmin, setShowAdmin] = useState(false);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors | null>(null);

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'positive' | 'negative';
    open: boolean;
  }>({ message: '', type: 'positive', open: false });

  // Handle customer info changes
  const handleCustomerInfoChange = useCallback((field: keyof CustomerInfo, value: string): void => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Derived: can submit if basic presence checks pass
  const canSubmit =
    !!customerInfo.firstName.trim() &&
    !!customerInfo.lastName.trim() &&
    !!customerInfo.email.trim() &&
    !!customerInfo.phone.trim() &&
    !!customerInfo.shippingAddress.trim() &&
    boxes.length > 0 &&
    allComplete &&
    !submitting &&
    boardId !== null;

  // Handle order submission
  const handleSubmit = useCallback(() => {
    if (!boardId) return;

    // Validate
    const errors = validateOrder({
      firstName: customerInfo.firstName,
      lastName: customerInfo.lastName,
      email: customerInfo.email,
      phone: customerInfo.phone,
      shippingAddress: customerInfo.shippingAddress,
      boxes: boxes
    });
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
      first_name: customerInfo.firstName.trim(),
      last_name: customerInfo.lastName.trim(),
      email: customerInfo.email.trim(),
      phone: customerInfo.phone.trim(),
      shipping_address: customerInfo.shippingAddress.trim(),
      boxes: boxes.map((box) => ({
        inscription: box.inscription,
        fragrance_ids: box.fragrances.map((f) => f.id) as [string, string, string],
      })),
    });
  }, [boardId, boxes, customerInfo, submit]);

  // Handle fragrance CRUD with error handling
  const handleAddFragrance = useCallback(
    async (form: FragranceForm): Promise<void> => {
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
    async (id: string, form: FragranceForm): Promise<void> => {
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
  const handleNewOrder = useCallback((): void => {
    reset();
    setCustomerInfo({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      shippingAddress: '',
    });
    setValidationErrors(null);
    // useOrderLines will maintain its state, but we could reset it if needed
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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--primary-background-hover-color)', margin: 0, padding: '32px 0' }}>
      {/* Main content: Order form or success screen */}
      {submitted && response ? (
        <OrderConfirmation
          orderId={response.orderId}
          boxCount={boxes.length}
          itemId={response.itemId}
          onNewOrder={handleNewOrder}
        />
      ) : (
        <OrderForm
          onOpenAdmin={() => {
            setShowAdmin(true);
          }}
          customerInfo={customerInfo}
          onCustomerInfoChange={handleCustomerInfoChange}
          customerErrors={validationErrors ? {
            firstName: validationErrors.firstName,
            lastName: validationErrors.lastName,
            email: validationErrors.email,
            phone: validationErrors.phone,
            shippingAddress: validationErrors.shippingAddress,
          } : undefined}
          boxes={boxes}
          availableFragrances={fragrances}
          onFragrancesChange={setFragrances}
          onInscriptionChange={setInscription}
          onAddBox={addBox}
          onRemoveBox={removeBox}
          onSubmit={handleSubmit}
          canSubmit={canSubmit}
          submitting={submitting}
          submitError={submitError}
          boxesError={validationErrors?.boxes}
          boxErrors={validationErrors?.boxErrors}
        />
      )}

      {/* Admin panel modal */}
      <FragranceEditor
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
          className="toast-above-modal"
        >
          {toast.message}
        </Toast>
      )}
    </div>
  );
}
