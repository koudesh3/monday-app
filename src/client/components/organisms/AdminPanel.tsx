/**
 * AdminPanel
 * Modal for managing the fragrance catalog
 */

import React, { useState } from 'react';
import { Heading, Text } from '@vibe/typography';
import { Search, Flex, Box } from '@vibe/core';
import { Button } from '@vibe/button';
import { Modal, ModalHeader, ModalContent, ModalBasicLayout } from '@vibe/core/next';
import { Divider, EmptyState } from '@vibe/core';
import { FragranceRow } from '../molecules/FragranceRow';
import { FragranceForm } from '../molecules/FragranceForm';
import { useSearch } from '../../hooks/useSearch';
import type { Fragrance, FragranceForm as FragranceFormData } from '../../api/fragrances';

export interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  fragrances: Fragrance[];
  onAdd: (form: FragranceFormData) => Promise<void>;
  onUpdate: (id: string, form: FragranceFormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

type FormMode = 'hidden' | 'add' | 'edit';

/**
 * Admin panel for managing fragrances.
 * - Search and filter fragrances
 * - Add new fragrances
 * - Edit/delete existing fragrances
 * - Delete confirmation dialog
 */
export function AdminPanel({
  open,
  onClose,
  fragrances,
  onAdd,
  onUpdate,
  onDelete,
}: AdminPanelProps) {
  const [formMode, setFormMode] = useState<FormMode>('hidden');
  const [editingFragrance, setEditingFragrance] = useState<Fragrance | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Fragrance | null>(null);

  const { query, setQuery, filtered } = useSearch(fragrances, [
    'name',
    'description',
    'category',
  ]);

  const handleAdd = () => {
    setFormMode('add');
    setEditingFragrance(null);
  };

  const handleEdit = (fragrance: Fragrance) => {
    setFormMode('edit');
    setEditingFragrance(fragrance);
  };

  const handleDeleteClick = (fragrance: Fragrance) => {
    setDeleteConfirm(fragrance);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm) {
      await onDelete(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleFormSave = async (form: FragranceFormData) => {
    if (formMode === 'add') {
      await onAdd(form);
    } else if (formMode === 'edit' && editingFragrance) {
      await onUpdate(editingFragrance.id, form);
    }
    setFormMode('hidden');
    setEditingFragrance(null);
  };

  const handleFormCancel = () => {
    setFormMode('hidden');
    setEditingFragrance(null);
  };

  console.log('AdminPanel render, open:', open);

  return (
    <Modal
      id="admin-panel-modal"
      show={open}
      onClose={onClose}
      closeButtonAriaLabel="Close admin panel"
      size="large"
    >
      <ModalBasicLayout>
        <ModalHeader
          title="Manage Fragrances"
          description={`${fragrances.length} ${fragrances.length === 1 ? 'fragrance' : 'fragrances'}`}
        />

        <ModalContent>
          <Flex
            direction="column"
            gap="medium"
            style={{
              padding: '24px',
              boxSizing: 'border-box',
            }}
          >
            <Flex gap="medium" align="center" style={{ width: '100%' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Search
                  placeholder="Search fragrances"
                  value={query}
                  onChange={setQuery}
                />
              </div>
              <Button
                kind="primary"
                size="small"
                onClick={handleAdd}
                disabled={formMode !== 'hidden'}
              >
                Add Fragrance
              </Button>
            </Flex>

            {formMode !== 'hidden' && (
              <Flex direction="column" gap="medium">
                <FragranceForm
                  mode={formMode}
                  initialValues={editingFragrance ?? undefined}
                  onSave={handleFormSave}
                  onCancel={handleFormCancel}
                />
                <Divider />
              </Flex>
            )}

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                minHeight: '300px',
              }}
            >
              {filtered.length === 0 ? (
                <EmptyState
                  description={
                    query
                      ? 'No fragrances found matching your search'
                      : 'No fragrances available. Add one to get started.'
                  }
                />
              ) : (
                filtered.map((fragrance, index) => (
                  <div key={fragrance.id}>
                    <FragranceRow
                      fragrance={fragrance}
                      mode="editable"
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                    />
                    {index < filtered.length - 1 && <Divider />}
                  </div>
                ))
              )}
            </div>
          </Flex>
        </ModalContent>
      </ModalBasicLayout>

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
          }}
        >
          <Box
            border
            rounded="medium"
            backgroundColor="primaryBackgroundColor"
            style={{
              maxWidth: '400px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
          >
            <Flex direction="column" gap="medium">
              <Heading type="h3">Delete Fragrance?</Heading>
              <Text type="text2" color="secondary">
                Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be
                undone. This fragrance will be removed from any boxes in the current order.
              </Text>
              <Flex gap="small" justify="end">
                <Button kind="tertiary" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button kind="primary" onClick={handleDeleteConfirm}>
                  Delete
                </Button>
              </Flex>
            </Flex>
          </Box>
        </div>
      )}
    </Modal>
  );
}
