/**
 * OrderForm
 * Main form layout for creating production orders
 */

import React from 'react';
import { Heading, Text } from '@vibe/typography';
import { TextField, Flex, Box as VibeBox } from '@vibe/core';
import { Button } from '@vibe/button';
import { IconButton } from '@vibe/icon-button';
import { Add } from '@vibe/icons';
import { OrderLine, OrderLineRef } from './OrderLine';
import type { Fragrance } from '../../api/fragrances';
import type { Box } from '../../hooks/useBoxes';

export interface OrderFormProps {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    shippingAddress: string;
    onFirstNameChange: (value: string) => void;
    onLastNameChange: (value: string) => void;
    onEmailChange: (value: string) => void;
    onPhoneChange: (value: string) => void;
    onShippingAddressChange: (value: string) => void;
    boxes: Box[];
    availableFragrances: Fragrance[];
    onFragrancesChange: (boxIndex: number, fragrances: Fragrance[]) => void;
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
    emailError?: string | null;
    phoneError?: string | null;
    shippingAddressError?: string | null;
    boxesError?: string | null;
    boxErrors?: Array<{ slots?: string; inscription?: string } | null>;
    inscriptionRefs: React.MutableRefObject<(OrderLineRef | null)[]>;
}

/**
 * Order form with name fields, box configurations, and submit button.
 * Uses <form> element for semantics and accessibility.
 * Submit button is type="submit", all others are type="button".
 */
export function OrderForm({
    firstName,
    lastName,
    email,
    phone,
    shippingAddress,
    onFirstNameChange,
    onLastNameChange,
    onEmailChange,
    onPhoneChange,
    onShippingAddressChange,
    boxes,
    availableFragrances,
    onFragrancesChange,
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
    emailError,
    phoneError,
    shippingAddressError,
    boxesError,
    boxErrors,
    inscriptionRefs,
}: OrderFormProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit} style={{ margin: 0, padding: 0 }}>
            <VibeBox backgroundColor="primaryBackgroundColor" padding="large" margin="auto" rounded="medium" style={{ width: '90%', maxWidth: '1400px' }}>
                <Flex direction="column" gap="large" style={{ width: '100%' }}>
                    <Flex align="center" justify="space-between" style={{ width: '100%' }}>
                        <Heading type="h1" style={{ textAlign: 'left' }}>Submit a New Order</Heading>
                        <Button
                            type="button"
                            leftIcon={Add}
                            kind="tertiary"
                            size="small"
                            onClick={onOpenAdmin}
                        >
                            Manage Fragrances
                        </Button>
                    </Flex>

                    <Flex direction="column" gap="medium" style={{ width: '100%' }}>
                        <Flex gap="medium" style={{ width: '100%' }}>
                            <TextField
                                id="order-first-name"
                                title="First Name"
                                placeholder="Enter first name"
                                value={firstName}
                                onChange={onFirstNameChange}
                                validation={firstNameError ? { status: 'error', text: firstNameError } : undefined}
                                required
                            />
                            <TextField
                                id="order-last-name"
                                title="Last Name"
                                placeholder="Enter last name"
                                value={lastName}
                                onChange={onLastNameChange}
                                validation={lastNameError ? { status: 'error', text: lastNameError } : undefined}
                                required
                            />
                        </Flex>
                        <Flex gap="medium" style={{ width: '100%' }}>
                            <TextField
                                id="order-email"
                                title="Email"
                                placeholder="example@email.com"
                                value={email}
                                onChange={onEmailChange}
                                validation={emailError ? { status: 'error', text: emailError } : undefined}
                                required
                            />
                            <TextField
                                id="order-phone"
                                title="Phone"
                                placeholder="(555) 123-4567"
                                value={phone}
                                onChange={onPhoneChange}
                                validation={phoneError ? { status: 'error', text: phoneError } : undefined}
                                required
                            />
                        </Flex>
                        <TextField
                            id="order-shipping-address"
                            title="Shipping Address"
                            placeholder="Enter full shipping address"
                            value={shippingAddress}
                            onChange={onShippingAddressChange}
                            validation={shippingAddressError ? { status: 'error', text: shippingAddressError } : undefined}
                            required
                        />
                    </Flex>

                    <Flex direction="column" gap="medium" align="start" style={{ width: '100%' }}>
                        <Flex align="center" gap="medium" justify="start">
                            <div>
                                <Heading type="h2" style={{ textAlign: 'left' }}>Order Lines</Heading>
                            </div>
                            <Text type="text3" color="secondary">
                                {boxes.length} {boxes.length === 1 ? 'box' : 'boxes'}
                            </Text>
                            <Button type="button" kind="primary" size="small" onClick={onAddBox}>
                                Add Box
                            </Button>
                        </Flex>

                        {boxesError && (
                            <Text type="text2" color="negative">
                                {boxesError}
                            </Text>
                        )}

                        <Flex direction="column" gap="medium" style={{ width: '100%' }}>
                            {boxes.map((box, index) => (
                                <OrderLine
                                    key={index}
                                    ref={(el) => (inscriptionRefs.current[index] = el)}
                                    box={box}
                                    boxNumber={index + 1}
                                    availableFragrances={availableFragrances}
                                    onFragrancesChange={(fragrances) => onFragrancesChange(index, fragrances)}
                                    onInscriptionChange={(inscription) => onInscriptionChange(index, inscription)}
                                    onRemove={() => onRemoveBox(index)}
                                    slotsError={boxErrors?.[index]?.slots}
                                    inscriptionError={boxErrors?.[index]?.inscription}
                                />
                            ))}
                        </Flex>
                    </Flex>

                    <Flex direction="column" align="center" gap="medium">
                        {submitError && (
                            <Text type="text2" color="negative">
                                {submitError}
                            </Text>
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
