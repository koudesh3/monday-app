/**
 * OrderForm
 * Main form layout for creating production orders
 */

import { Heading, Text } from '@vibe/typography';
import { TextField, Flex, Box } from '@vibe/core';
import { Button } from '@vibe/button';
import { IconButton } from '@vibe/icon-button';
import { Add } from '@vibe/icons';
import { OrderLine } from './OrderLine';
import type { Fragrance } from '../../api/fragrances';
import type { OrderLine as OrderLineType } from '../../hooks/useOrderLines';

export interface CustomerInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    shippingAddress: string;
}

export interface OrderFormProps {
    customerInfo: CustomerInfo;
    onCustomerInfoChange: (field: keyof CustomerInfo, value: string) => void;
    customerErrors?: Partial<Record<keyof CustomerInfo, string>>;
    boxes: OrderLineType[];
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
    boxesError?: string | null;
    boxErrors?: Array<{ slots?: string; inscription?: string } | null>;
}

/**
 * Order form with name fields, box configurations, and submit button.
 * Uses <form> element for semantics and accessibility.
 * Submit button is type="submit", all others are type="button".
 */
export function OrderForm({
    customerInfo,
    onCustomerInfoChange,
    customerErrors,
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
    boxesError,
    boxErrors,
}: OrderFormProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit} className="order-form">
            <Box backgroundColor="primaryBackgroundColor" padding="large" margin="auto" rounded="medium" className="order-form-container">
                <Flex direction="column" gap="large" align="stretch">
                    <Flex align="center" justify="space-between">
                        <Heading type="h1">Submit a New Order</Heading>
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

                    <Flex direction="column" gap="medium" align="stretch">
                        <Flex gap="medium">
                            <TextField
                                id="order-first-name"
                                title="First Name"
                                placeholder="Enter first name"
                                value={customerInfo.firstName}
                                onChange={(value) => onCustomerInfoChange('firstName', value)}
                                validation={customerErrors?.firstName ? { status: 'error', text: customerErrors.firstName } : undefined}
                                required
                            />
                            <TextField
                                id="order-last-name"
                                title="Last Name"
                                placeholder="Enter last name"
                                value={customerInfo.lastName}
                                onChange={(value) => onCustomerInfoChange('lastName', value)}
                                validation={customerErrors?.lastName ? { status: 'error', text: customerErrors.lastName } : undefined}
                                required
                            />
                        </Flex>
                        <Flex gap="medium">
                            <TextField
                                id="order-email"
                                title="Email"
                                placeholder="example@email.com"
                                value={customerInfo.email}
                                onChange={(value) => onCustomerInfoChange('email', value)}
                                validation={customerErrors?.email ? { status: 'error', text: customerErrors.email } : undefined}
                                required
                            />
                            <TextField
                                id="order-phone"
                                title="Phone"
                                placeholder="(555) 123-4567"
                                value={customerInfo.phone}
                                onChange={(value) => onCustomerInfoChange('phone', value)}
                                validation={customerErrors?.phone ? { status: 'error', text: customerErrors.phone } : undefined}
                                required
                            />
                        </Flex>
                        <TextField
                            id="order-shipping-address"
                            title="Shipping Address"
                            placeholder="Enter full shipping address"
                            value={customerInfo.shippingAddress}
                            onChange={(value) => onCustomerInfoChange('shippingAddress', value)}
                            validation={customerErrors?.shippingAddress ? { status: 'error', text: customerErrors.shippingAddress } : undefined}
                            required
                        />
                    </Flex>

                    <Flex direction="column" gap="medium" align="stretch">
                        <Flex align="center" gap="medium" justify="start">
                            <Heading type="h2">Order Lines</Heading>
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

                        <Flex direction="column" gap="medium" align="stretch">
                            {boxes.map((box, index) => (
                                <OrderLine
                                    key={box.id}
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
            </Box>
        </form>
    );
}
