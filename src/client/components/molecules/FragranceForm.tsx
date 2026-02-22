/**
 * FragranceForm
 * Add/edit form for fragrances in the admin panel
 */

import React, { useState, useEffect } from 'react';
import { TextField, Flex, Box } from '@vibe/core';
import { Dropdown } from '@vibe/core/next';
import { Button } from '@vibe/button';
import { CATEGORIES } from '../../constants';
import { rules } from '../../validation';
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
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [category, setCategory] = useState(initialValues?.category ?? '');
  const [imageUrl, setImageUrl] = useState(initialValues?.image_url ?? '');
  const [recipe, setRecipe] = useState(initialValues?.recipe ?? '');

  const [nameError, setNameError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);
  const [imageUrlError, setImageUrlError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  // Reset form when initialValues change
  useEffect(() => {
    setName(initialValues?.name ?? '');
    setDescription(initialValues?.description ?? '');
    setCategory(initialValues?.category ?? '');
    setImageUrl(initialValues?.image_url ?? '');
    setRecipe(initialValues?.recipe ?? '');
    setNameError(null);
    setDescError(null);
    setImageUrlError(null);
  }, [initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const nErr = rules.fragName(name);
    const dErr = rules.fragDesc(description);
    let iErr: string | null = null;
    if (!imageUrl.trim()) {
      iErr = 'Required';
    } else {
      try {
        new URL(imageUrl);
      } catch {
        iErr = 'Invalid URL';
      }
    }

    setNameError(nErr);
    setDescError(dErr);
    setImageUrlError(iErr);

    if (nErr || dErr || iErr || !category.trim() || !recipe.trim()) {
      return;
    }

    try {
      setSaving(true);
      await onSave({
        name: name.trim(),
        description: description.trim(),
        category,
        image_url: imageUrl.trim(),
        recipe: recipe.trim(),
      });
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
      <Box border rounded="medium" backgroundColor="primaryBackgroundColor" style={{ padding: '16px' }}>
        <Flex direction="column" gap="medium">
        <TextField
          title="Name"
          placeholder="Enter fragrance name"
          value={name}
          onChange={setName}
          onBlur={() => setNameError(rules.fragName(name))}
          validation={nameError ? { status: 'error', text: nameError } : undefined}
          required
        />

        <TextField
          title="Description"
          placeholder="Enter description"
          value={description}
          onChange={setDescription}
          onBlur={() => setDescError(rules.fragDesc(description))}
          validation={descError ? { status: 'error', text: descError } : undefined}
        />

        <Dropdown
          placeholder="Select category"
          options={categoryOptions}
          value={category ? { value: category, label: category } : undefined}
          onChange={(option) => setCategory(option?.value ?? '')}
          required
        />

        <TextField
          title="Image URL"
          placeholder="https://example.com/image.jpg"
          value={imageUrl}
          onChange={setImageUrl}
          onBlur={() => {
            if (!imageUrl.trim()) {
              setImageUrlError('Required');
            } else {
              try {
                new URL(imageUrl);
                setImageUrlError(null);
              } catch {
                setImageUrlError('Invalid URL');
              }
            }
          }}
          validation={imageUrlError ? { status: 'error', text: imageUrlError } : undefined}
          required
        />

        <TextField
          title="Recipe"
          placeholder="Enter recipe or formula"
          value={recipe}
          onChange={setRecipe}
          required
        />

        <Flex gap="small" justify="end" style={{ marginTop: '8px' }}>
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
