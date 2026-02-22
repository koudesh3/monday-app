/**
 * SuccessScreen
 * Post-submission confirmation screen
 */

import React from 'react';
import { Heading, Text } from '@vibe/typography';
import { Button } from '@vibe/button';
import { Flex, Box } from '@vibe/core';

export interface SuccessScreenProps {
  boxCount: number;
  itemId: string;
  onNewOrder: () => void;
}

/**
 * Success confirmation after order submission.
 * Shows box count and Monday.com item ID.
 */
export function SuccessScreen({ boxCount, itemId, onNewOrder }: SuccessScreenProps) {
  return (
    <Flex
      align="center"
      justify="center"
      style={{
        minHeight: '100vh',
        padding: '24px',
        backgroundColor: 'var(--primary-background-hover-color)',
      }}
    >
      <Box
        border
        rounded="medium"
        backgroundColor="primaryBackgroundColor"
        style={{
          maxWidth: '500px',
          padding: '48px',
          textAlign: 'center',
        }}
      >
        <Flex direction="column" align="center" gap="large">
          <div
            style={{
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              backgroundColor: 'var(--positive-color)',
              color: 'white',
              borderRadius: '50%',
            }}
          >
            ✓
          </div>
          <Heading type="h1">Order Submitted!</Heading>
          <Text type="text1" color="secondary">
            Your production order has been created successfully.
          </Text>
          <Flex
            direction="column"
            gap="small"
            style={{
              padding: '16px',
              backgroundColor: 'var(--primary-background-hover-color)',
              borderRadius: '8px',
              width: '100%',
            }}
          >
            <Text type="text2">
              <strong>Boxes:</strong> {boxCount}
            </Text>
            <Text type="text3" color="secondary">
              Monday.com Item ID: {itemId}
            </Text>
          </Flex>
          <Button kind="primary" size="large" onClick={onNewOrder}>
            Create New Order
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
}
