/**
 * AdminPanel
 * Modal for managing the fragrance catalog
 */

import React, { useState } from 'react';
import { Text } from '@vibe/typography';
import { Search, Flex } from '@vibe/core';
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

type FormState =
    | { mode: 'hidden' }
    | { mode: 'add' }
    | { mode: 'edit'; fragrance: Fragrance };

type DeleteState =
    | { open: false }
    | { open: true; fragrance: Fragrance; deleting: boolean; error: string | null };

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
    const [formState, setFormState] = useState<FormState>({ mode: 'hidden' });
    const [deleteState, setDeleteState] = useState<DeleteState>({ open: false });
    const [formError, setFormError] = useState<string | null>(null);

    const { query, setQuery, filtered } = useSearch(fragrances, [
        'name',
        'description',
        'category',
    ]);

    const handleAdd = () => {
        setFormState({ mode: 'add' });
        setFormError(null);
    };

    const handleEdit = (fragrance: Fragrance) => {
        setFormState({ mode: 'edit', fragrance });
        setFormError(null);
    };

    const handleDeleteClick = (fragrance: Fragrance) => {
        setDeleteState({ open: true, fragrance, deleting: false, error: null });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteState.open) return;

        setDeleteState({ ...deleteState, deleting: true, error: null });

        try {
            await onDelete(deleteState.fragrance.id);
            setDeleteState({ open: false });
        } catch (err) {
            setDeleteState({
                ...deleteState,
                deleting: false,
                error: err instanceof Error ? err.message : 'Failed to delete fragrance',
            });
        }
    };

    const handleFormSave = async (form: FragranceFormData) => {
        setFormError(null);

        try {
            if (formState.mode === 'add') {
                await onAdd(form);
            } else if (formState.mode === 'edit') {
                await onUpdate(formState.fragrance.id, form);
            }
            setFormState({ mode: 'hidden' });
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to save fragrance');
        }
    };

    const handleFormCancel = () => {
        setFormState({ mode: 'hidden' });
        setFormError(null);
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
                    <Flex direction="column" gap="medium">
                        <Flex gap="medium" align="center">
                            <Search
                                placeholder="Search fragrances"
                                value={query}
                                onChange={setQuery}
                            />
                            <Button
                                kind="primary"
                                size="small"
                                onClick={handleAdd}
                                disabled={formState.mode !== 'hidden'}
                            >
                                Add Fragrance
                            </Button>
                        </Flex>

                        {formState.mode !== 'hidden' && (
                            <Flex direction="column" gap="medium">
                                {formError && (
                                    <Text type="text2" color="negative">
                                        {formError}
                                    </Text>
                                )}
                                <FragranceForm
                                    key={formState.mode === 'edit' ? formState.fragrance.id : 'new'}
                                    mode={formState.mode}
                                    initialValues={formState.mode === 'edit' ? formState.fragrance : undefined}
                                    onSave={handleFormSave}
                                    onCancel={handleFormCancel}
                                />
                                <Divider />
                            </Flex>
                        )}

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
                    </Flex>
                </ModalContent>
            </ModalBasicLayout>

            {/* Delete confirmation dialog */}
            {deleteState.open && (
                <Modal
                    id="delete-confirm-modal"
                    show={deleteState.open}
                    onClose={() => !deleteState.deleting && setDeleteState({ open: false })}
                    closeButtonAriaLabel="Cancel delete"
                    size="small"
                >
                    <ModalBasicLayout>
                        <ModalHeader title="Delete Fragrance?" />
                        <ModalContent>
                            <Flex direction="column" gap="medium">
                                <Text type="text2" color="secondary">
                                    Are you sure you want to delete "{deleteState.fragrance.name}"? This action
                                    cannot be undone. This fragrance will be removed from any boxes in the current
                                    order.
                                </Text>

                                {deleteState.error && (
                                    <Text type="text2" color="negative">
                                        {deleteState.error}
                                    </Text>
                                )}

                                <Flex gap="small" justify="end">
                                    <Button
                                        kind="tertiary"
                                        onClick={() => setDeleteState({ open: false })}
                                        disabled={deleteState.deleting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        kind="primary"
                                        onClick={handleDeleteConfirm}
                                        disabled={deleteState.deleting}
                                        loading={deleteState.deleting}
                                    >
                                        Delete
                                    </Button>
                                </Flex>
                            </Flex>
                        </ModalContent>
                    </ModalBasicLayout>
                </Modal>
            )}
        </Modal>
    );
}
