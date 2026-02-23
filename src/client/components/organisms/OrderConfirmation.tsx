/**
 * OrderConfirmation
 * Post-submission confirmation screen
 */

import React from 'react';
import { Heading, Text } from '@vibe/typography';
import { Button } from '@vibe/button';
import { Flex, Box } from '@vibe/core';

export interface OrderConfirmationProps {
  boxCount: number;
  itemId: string;
  onNewOrder: () => void;
}

/**
 * Order confirmation after successful submission.
 * Shows box count and Monday.com item ID.
 */
export function OrderConfirmation({ boxCount, itemId, onNewOrder }: OrderConfirmationProps) {
  return (
    <Flex align="center" justify="center" padding="large">
      <Box border rounded="medium" backgroundColor="primaryBackgroundColor" padding="xxl">
        <Flex direction="column" align="center" gap="large">
          <Box>
            ✓
          </Box>
          <Heading type="h1">Order Submitted!</Heading>
          <Text type="text1" color="secondary">
            Your production order has been created successfully.
          </Text>
          <Box backgroundColor="secondaryBackgroundColor" rounded="small" padding="medium">
            <Flex direction="column" gap="small">
              <Text type="text2">
                <strong>Boxes:</strong> {boxCount}
              </Text>
              <Text type="text3" color="secondary">
                Monday.com Item ID: {itemId}
              </Text>
            </Flex>
          </Box>
          <Button kind="primary" size="large" onClick={onNewOrder}>
            Create New Order
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
}
