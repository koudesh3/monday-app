/**
 * FragranceForm
 * Add/edit form for fragrances in the admin panel
 */

import React, { useState } from 'react';
import { TextField, TextArea, Flex, Box } from '@vibe/core';
import { Button } from '@vibe/button';
import { Text } from '@vibe/typography';
import { rules, validateFragranceForm } from '../../validation';
import type { FragranceForm as FragranceFormData } from '../../api/fragrances';

export interface FragranceFormProps {
    initialValues?: Partial<FragranceFormData>;
    onSave: (form: FragranceFormData) => void | Promise<void>;
    onCancel: () => void;
    mode: 'add' | 'edit';
}

/**
 * Form for adding or editing a fragrance.
 * Validates fields on blur and on submit.
 */
export function FragranceForm({
    initialValues,
    onSave,
    onCancel,
    mode,
}: FragranceFormProps) {
    const [form, setForm] = useState<FragranceFormData>({
        name: initialValues?.name ?? '',
        description: initialValues?.description ?? '',
        category: initialValues?.category ?? '',
        image_url: initialValues?.image_url ?? '',
        recipe: initialValues?.recipe ?? '',
    });

    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [saving, setSaving] = useState(false);

    const setField = (field: keyof FragranceFormData, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errs = validateFragranceForm(form);
        setErrors(errs);

        if (Object.values(errs).some(Boolean)) {
            return;
        }

        try {
            setSaving(true);
            await onSave({
                name: form.name.trim(),
                description: form.description.trim(),
                category: form.category,
                image_url: form.image_url.trim() || undefined,
                recipe: form.recipe.trim(),
            });
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="fragrance-form">
            <Flex direction="column" gap="medium" align="stretch">
                <TextField
                    id="fragrance-name"
                    title="Name"
                    placeholder="Enter fragrance name"
                    value={form.name}
                    onChange={(value) => setField('name', value)}
                    onBlur={() => setErrors((prev) => ({ ...prev, name: rules.fragName(form.name) }))}
                    validation={errors.name ? { status: 'error', text: errors.name } : undefined}
                    required
                />

                <TextField
                    id="fragrance-description"
                    title="Description"
                    placeholder="Enter description"
                    value={form.description}
                    onChange={(value) => setField('description', value)}
                    onBlur={() => setErrors((prev) => ({ ...prev, description: rules.fragDesc(form.description) }))}
                    validation={errors.description ? { status: 'error', text: errors.description } : undefined}
                />

                <TextField
                    id="fragrance-category"
                    title="Category"
                    placeholder="e.g. Fresh, Woody, Floral"
                    value={form.category}
                    onChange={(value) => setField('category', value)}
                    onBlur={() => setErrors((prev) => ({ ...prev, category: rules.category(form.category) }))}
                    validation={errors.category ? { status: 'error', text: errors.category } : undefined}
                    required
                />

                <TextField
                    id="fragrance-image-url"
                    title="Image URL"
                    placeholder="https://example.com/image.jpg"
                    value={form.image_url}
                    onChange={(value) => setField('image_url', value)}
                    onBlur={() => setErrors((prev) => ({ ...prev, image_url: rules.imageUrl(form.image_url) }))}
                    validation={errors.image_url ? { status: 'error', text: errors.image_url } : undefined}
                />

                <TextArea
                    id="fragrance-recipe"
                    label="Recipe"
                    placeholder="Enter recipe or formula"
                    value={form.recipe}
                    onChange={(e) => setField('recipe', e.target.value)}
                    onBlur={() => setErrors((prev) => ({ ...prev, recipe: !form.recipe.trim() ? 'Required' : null }))}
                    error={!!errors.recipe}
                    helpText={errors.recipe || undefined}
                />

                <Flex gap="small" justify="end">
                    <Button type="button" kind="tertiary" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" kind="primary" disabled={saving} loading={saving}>
                        {mode === 'add' ? 'Add Fragrance' : 'Save Changes'}
                    </Button>
                </Flex>
            </Flex>
        </form>
    );
}
