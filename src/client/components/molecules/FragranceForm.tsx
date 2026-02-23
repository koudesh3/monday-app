/**
 * FragranceForm
 * Add/edit form for fragrances in the admin panel
 */

import React, { useState } from 'react';
import { TextField, Flex, Box } from '@vibe/core';
import { Dropdown } from '@vibe/core/next';
import { Button } from '@vibe/button';
import { Text } from '@vibe/typography';
import { CATEGORIES } from '../../constants';
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
        image_url: form.image_url.trim(),
        recipe: form.recipe.trim(),
      });
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = CATEGORIES.map((cat) => ({
    value: cat,
    label: cat,
  }));

  return (
    <form onSubmit={handleSubmit}>
      <Box border rounded="medium" backgroundColor="primaryBackgroundColor" padding="medium">
        <Flex direction="column" gap="medium">
        <TextField
          title="Name"
          placeholder="Enter fragrance name"
          value={form.name}
          onChange={(value) => setField('name', value)}
          onBlur={() => setErrors((prev) => ({ ...prev, name: rules.fragName(form.name) }))}
          validation={errors.name ? { status: 'error', text: errors.name } : undefined}
          required
        />

        <TextField
          title="Description"
          placeholder="Enter description"
          value={form.description}
          onChange={(value) => setField('description', value)}
          onBlur={() => setErrors((prev) => ({ ...prev, description: rules.fragDesc(form.description) }))}
          validation={errors.description ? { status: 'error', text: errors.description } : undefined}
        />

        <Flex direction="column" gap="xs">
          <Dropdown
            placeholder="Select category"
            options={categoryOptions}
            value={form.category ? { value: form.category, label: form.category } : undefined}
            onChange={(option) => setField('category', option?.value ?? '')}
            onBlur={() => setErrors((prev) => ({ ...prev, category: !form.category.trim() ? 'Required' : null }))}
            required
          />
          {errors.category && (
            <Text type="text2" color="negative">
              {errors.category}
            </Text>
          )}
        </Flex>

        <TextField
          title="Image URL"
          placeholder="https://example.com/image.jpg"
          value={form.image_url}
          onChange={(value) => setField('image_url', value)}
          onBlur={() => setErrors((prev) => ({ ...prev, image_url: rules.imageUrl(form.image_url) }))}
          validation={errors.image_url ? { status: 'error', text: errors.image_url } : undefined}
          required
        />

        <TextField
          title="Recipe"
          placeholder="Enter recipe or formula"
          value={form.recipe}
          onChange={(value) => setField('recipe', value)}
          onBlur={() => setErrors((prev) => ({ ...prev, recipe: !form.recipe.trim() ? 'Required' : null }))}
          validation={errors.recipe ? { status: 'error', text: errors.recipe } : undefined}
          required
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
      </Box>
    </form>
  );
}
