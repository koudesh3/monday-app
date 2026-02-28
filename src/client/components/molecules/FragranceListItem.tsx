/**
 * FragranceListItem
 * A single fragrance displayed as a list item
 * Supports two modes: selectable (for picker) and editable (for admin panel)
 */

import { Text } from '@vibe/typography';
import { Label, Flex, Clickable } from '@vibe/core';
import { IconButton } from '@vibe/icon-button';
import { Edit, Delete } from '@vibe/icons';
import type { Fragrance } from '../../api/fragrances';

export interface FragranceListItemProps {
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
export function FragranceListItem({
    fragrance,
    mode,
    onSelect,
    onEdit,
    onDelete,
}: FragranceListItemProps) {
    const handleClick = () => {
        onSelect?.(fragrance);
    };

    const handleEdit = () => {
        onEdit?.(fragrance);
    };

    const handleDelete = () => {
        onDelete?.(fragrance);
    };

    const content = (
        <Flex align="center" justify="space-between" gap="medium">
            <Flex direction="column" gap="xs" align="start">
                <Flex align="center" gap="small">
                    <Text type="text2" weight="medium" ellipsis>
                        {fragrance.name}
                    </Text>
                    <Label text={fragrance.category} />
                </Flex>
                {fragrance.description && (
                    <Text type="text3" color="secondary" maxLines={2}>
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
    );

    if (mode === 'selectable') {
        return (
            <Clickable
                onClick={handleClick}
                ariaLabel={`Select ${fragrance.name}`}
            >
                {content}
            </Clickable>
        );
    }

    return <div>{content}</div>;
}
