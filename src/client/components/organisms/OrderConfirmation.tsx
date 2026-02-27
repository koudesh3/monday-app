/**
 * OrderConfirmation
 * Post-submission confirmation screen
 */
import React from 'react';
import { Heading, Text } from '@vibe/typography';
import { Button } from '@vibe/button';
import { Flex, Box } from '@vibe/core';

export interface OrderConfirmationProps {
    orderId: string;
    boxCount: number;
    itemId: string;
    onNewOrder: () => void;
}

/**
 * Order confirmation after successful submission.
 * Shows order ID, box count, and Monday.com item ID.
 */
export function OrderConfirmation({ orderId, boxCount, itemId, onNewOrder }: OrderConfirmationProps) {
    return (
        <Flex align="center" justify="center">
            <Box border rounded="medium" backgroundColor="primaryBackgroundColor" padding="xxl">
                <Flex direction="column" align="center" gap="large">
                    <Box aria-hidden="true">
                        ✅
                    </Box>
                    <Heading type="h1">Order Submitted!</Heading>
                    <Text type="text1" color="secondary">
                        Your order has been submitted successfully.
                    </Text>
                    <Box backgroundColor="secondaryBackgroundColor" rounded="small" padding="medium">
                        <Flex direction="column" gap="small">
                            <Text type="text2">
                                <Text element="span" weight="bold">Order ID:</Text> {orderId}
                            </Text>
                            <Text type="text2">
                                <Text element="span" weight="bold">Gift Boxes:</Text> {boxCount}
                            </Text>
                            <Text type="text3" color="secondary">
                                Item ID: {itemId}
                            </Text>
                        </Flex>
                    </Box>
                    <Button kind="primary" size="large" onClick={onNewOrder}>
                        Submit Another Order
                    </Button>
                </Flex>
            </Box>
        </Flex>
    );
}