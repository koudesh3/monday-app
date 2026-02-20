import React from 'react';
import { Checkbox } from '@vibe/core';

export type FragranceOption = {
    id: string;
    name: string;
};

type FragrancePickerProps = {
    fragrances: FragranceOption[];
    selected: string[];
    onChange: (ids: string[]) => void;
};

export function toggleFragranceSelection(
    selected: string[],
    id: string
): string[] {
    if (selected.includes(id)) {
        return selected.filter((selectedId) => selectedId !== id);
    }
    if (selected.length < 3) {
        return [...selected, id];
    }
    return selected;
}

export default function FragrancePicker({
    fragrances,
    selected,
    onChange,
}: FragrancePickerProps) {
    return (
        <div>
            {fragrances.map((fragrance) => {
                const isSelected = selected.includes(fragrance.id);
                const isDisabled = !isSelected && selected.length >= 3;

                return (
                    <Checkbox
                        key={fragrance.id}
                        label={fragrance.name}
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => onChange(toggleFragranceSelection(selected, fragrance.id))}
                    />
                );
            })}
        </div>
    );
}
