/**
 * FragranceRow
 * A single fragrance displayed as a row
 * Supports two modes: selectable (for picker) and editable (for admin panel)
 */

import React from 'react';
import { Text } from '@vibe/typography';
import { Label, Flex, Box } from '@vibe/core';
import { IconButton } from '@vibe/icon-button';
import { Edit, Delete } from '@vibe/icons';
import { useHover } from '@vibe/core';
import { CategoryDot } from '../atoms/CategoryDot';
import type { Fragrance } from '../../api/fragrances';

export interface FragranceRowProps {
    fragrance: Fragrance;
    mode: 'selectable' | 'editable';
    onSelect?: (fragrance: Fragrance) => void;
    onEdit?: (fragrance: Fragrance) => void;
    onDelete?: (fragrance: Fragrance) => void;
}

/**
 * Display a fragrance as a row with category indicator and actions.
 * - mode="selectable": Click fires onSelect (used in picker dropdown)
 * - mode="editable": Shows edit/delete IconButtons (used in admin panel)
 */
export function FragranceRow({
    fragrance,
    mode,
    onSelect,
    onEdit,
    onDelete,
}: FragranceRowProps) {
    const [hoverRef, isHovered] = useHover<HTMLDivElement>();

    const handleClick = () => {
        if (mode === 'selectable' && onSelect) {
            onSelect(fragrance);
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit?.(fragrance);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.(fragrance);
    };

    return (
        <div
            ref={mode === 'selectable' ? hoverRef : undefined}
            role={mode === 'selectable' ? 'button' : undefined}
            tabIndex={mode === 'selectable' ? 0 : undefined}
            onClick={handleClick}
            onKeyDown={
                mode === 'selectable'
                    ? (e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleClick();
                        }
                    }
                    : undefined
            }
        >
            <Flex align="center" justify="space-between" gap="medium">
                <Flex direction="column" gap="xs">
                    <Flex align="center" gap="small">
                        <CategoryDot category={fragrance.category} />
                        <Text type="text2" weight="medium" ellipsis>
                            {fragrance.name}
                        </Text>
                        <Label text={fragrance.category} />
                    </Flex>
                    {fragrance.description && (
                        <Text type="text3" color="secondary" className="text-clamp-2">
                            {fragrance.description}
                        </Text>
                    )}
                </Flex>

                {mode === 'editable' && (
                    <Flex gap="xs">
                        <IconButton
                            icon={Edit}
                            size="small"
                            kind="tertiary"
                            ariaLabel="Edit fragrance"
                            onClick={handleEdit}
                        />
                        <IconButton
                            icon={Delete}
                            size="small"
                            kind="tertiary"
                            ariaLabel="Delete fragrance"
                            onClick={handleDelete}
                        />
                    </Flex>
                )}
            </Flex>
        </div>
    );
}
