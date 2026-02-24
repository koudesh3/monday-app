import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSubitemsWithStatus = vi.fn();
const mockUpdateItemStatus = vi.fn();
const mockGetItemStatus = vi.fn();
const mockUpdateItemDate = vi.fn();

vi.mock('@mondaycom/apps-sdk', () => ({
    Logger: class {
        info() { }
        error() { }
        warn() { }
        debug() { }
    },
    EnvironmentVariablesManager: class {
        get(key: string) {
            if (key === 'MONDAY_SIGNING_SECRET') return 'test-secret';
            return undefined;
        }
    },
    SecureStorage: class {
        async get(_key: string) {
            return null;
        }
        async set(_key: string, _value: any) {
            return true;
        }
        async delete(_key: string) {
            return true;
        }
    },
}));

vi.mock('../../src/server/mondayClient', () => ({
    createItem: vi.fn(),
    createSubitem: vi.fn(),
    getSubitemsWithStatus: (...args: any[]) => mockGetSubitemsWithStatus(...args),
    updateItemStatus: (...args: any[]) => mockUpdateItemStatus(...args),
    getItemStatus: (...args: any[]) => mockGetItemStatus(...args),
    updateItemDate: (...args: any[]) => mockUpdateItemDate(...args),
    COLUMN_IDS: {
        EMAIL: 'email',
        PHONE: 'phone',
        FIRST_NAME: 'text',
        LAST_NAME: 'text6',
        SHIPPING_ADDRESS: 'text_mm0wrxwk',
        ORDER_RECEIVED_DATE: 'date_1',
        INSCRIPTION: 'long_text_mm0qycr9',
        FRAGRANCES: 'dropdown_mm0qkhzm',
        SUBITEM_STATUS: 'color_mm0qcgc2',
        PARENT_STATUS: 'status',
        ORDER_COMPLETE_DATE: 'date_13',
    },
}));

import { app } from '../../src/server/server';

describe('Webhook API', () => {
    beforeEach(() => {
        mockGetSubitemsWithStatus.mockReset();
        mockUpdateItemStatus.mockReset();
        mockGetItemStatus.mockReset();
        mockUpdateItemDate.mockReset();
    });

    describe('Challenge handshake', () => {
        it('returns challenge value when present in request body', async () => {
            // Arrange - no setup needed

            // Act
            const res = await app.request('/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ challenge: 'test-challenge-123' }),
            });

            // Assert
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body).toEqual({ challenge: 'test-challenge-123' });
            expect(mockGetSubitemsWithStatus).not.toHaveBeenCalled();
        });
    });

    describe('Event filtering', () => {
        it('ignores events with non-status columnId', async () => {
            // Arrange - no setup needed

            // Act
            const res = await app.request('/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: {
                        boardId: 18400830997,
                        pulseId: 1772139123,
                        columnId: 'some_other_column',
                        columnType: 'text',
                        value: { label: { index: 1, text: 'foo' } },
                        type: 'update_column_value',
                        parentItemId: '1771812716',
                        parentItemBoardId: 1771812698,
                    },
                }),
            });

            // Assert
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body).toEqual({ ok: true });
            expect(mockGetSubitemsWithStatus).not.toHaveBeenCalled();
        });

        it('returns ok when event object is missing', async () => {
            // Arrange - no setup needed

            // Act
            const res = await app.request('/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            // Assert
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body).toEqual({ ok: true });
        });
    });

    describe('Status rollup logic', () => {
        it('sets parent to "Not Started" when any subitem is "Not Started"', async () => {
            // Arrange
            mockGetItemStatus.mockResolvedValue('In Progress');
            mockGetSubitemsWithStatus.mockResolvedValue([
                { id: 'sub1', statusLabel: 'Shipped' },
                { id: 'sub2', statusLabel: 'Not Started' },
                { id: 'sub3', statusLabel: 'In Progress' },
            ]);

            // Act
            const res = await app.request('/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: {
                        boardId: 18400830997,
                        pulseId: 1772139123,
                        columnId: 'color_mm0qcgc2',
                        columnType: 'color',
                        value: { label: { index: 3, text: 'Shipped' } },
                        type: 'update_column_value',
                        parentItemId: '1771812716',
                        parentItemBoardId: 1771812698,
                    },
                }),
            });

            // Assert
            expect(res.status).toBe(200);
            expect(mockUpdateItemStatus).toHaveBeenCalledWith(
                expect.objectContaining({ statusLabel: 'Not Started' })
            );
        });

        it('sets parent to "Backordered" when any subitem is "Backordered" and none are "Not Started"', async () => {
            // Arrange
            mockGetItemStatus.mockResolvedValue('In Progress');
            mockGetSubitemsWithStatus.mockResolvedValue([
                { id: 'sub1', statusLabel: 'Shipped' },
                { id: 'sub2', statusLabel: 'Backordered' },
                { id: 'sub3', statusLabel: 'In Progress' },
            ]);

            // Act
            const res = await app.request('/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: {
                        boardId: 18400830997,
                        pulseId: 1772139123,
                        columnId: 'color_mm0qcgc2',
                        columnType: 'color',
                        value: { label: { index: 3, text: 'Shipped' } },
                        type: 'update_column_value',
                        parentItemId: '1771812716',
                        parentItemBoardId: 1771812698,
                    },
                }),
            });

            // Assert
            expect(res.status).toBe(200);
            expect(mockUpdateItemStatus).toHaveBeenCalledWith(
                expect.objectContaining({ statusLabel: 'Backordered' })
            );
        });

        it('sets parent to "In Progress" when any subitem is "In Progress" and none are "Not Started" or "Backordered"', async () => {
            // Arrange
            mockGetItemStatus.mockResolvedValue('Not Started');
            mockGetSubitemsWithStatus.mockResolvedValue([
                { id: 'sub1', statusLabel: 'Shipped' },
                { id: 'sub2', statusLabel: 'In Progress' },
                { id: 'sub3', statusLabel: 'Shipped' },
            ]);

            // Act
            const res = await app.request('/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: {
                        boardId: 18400830997,
                        pulseId: 1772139123,
                        columnId: 'color_mm0qcgc2',
                        columnType: 'color',
                        value: { label: { index: 3, text: 'Shipped' } },
                        type: 'update_column_value',
                        parentItemId: '1771812716',
                        parentItemBoardId: 1771812698,
                    },
                }),
            });

            // Assert
            expect(res.status).toBe(200);
            expect(mockUpdateItemStatus).toHaveBeenCalledWith(
                expect.objectContaining({ statusLabel: 'In Progress' })
            );
        });

        it('sets parent to "Shipped" when all subitems are "Shipped"', async () => {
            // Arrange
            mockGetItemStatus.mockResolvedValue('In Progress');
            mockGetSubitemsWithStatus.mockResolvedValue([
                { id: 'sub1', statusLabel: 'Shipped' },
                { id: 'sub2', statusLabel: 'Shipped' },
                { id: 'sub3', statusLabel: 'Shipped' },
            ]);

            // Act
            const res = await app.request('/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: {
                        boardId: 18400830997,
                        pulseId: 1772139123,
                        columnId: 'color_mm0qcgc2',
                        columnType: 'color',
                        value: { label: { index: 3, text: 'Shipped' } },
                        type: 'update_column_value',
                        parentItemId: '1771812716',
                        parentItemBoardId: 1771812698,
                    },
                }),
            });

            // Assert
            expect(res.status).toBe(200);
            expect(mockUpdateItemStatus).toHaveBeenCalledWith(
                expect.objectContaining({ statusLabel: 'Shipped' })
            );
        });

        it('handles null status labels gracefully (treats as "Not Started")', async () => {
            // Arrange
            mockGetItemStatus.mockResolvedValue('In Progress');
            mockGetSubitemsWithStatus.mockResolvedValue([
                { id: 'sub1', statusLabel: null },
                { id: 'sub2', statusLabel: null },
            ]);

            // Act
            const res = await app.request('/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: {
                        boardId: 18400830997,
                        pulseId: 1772139123,
                        columnId: 'color_mm0qcgc2',
                        columnType: 'color',
                        value: { label: { index: 3, text: 'Shipped' } },
                        type: 'update_column_value',
                        parentItemId: '1771812716',
                        parentItemBoardId: 1771812698,
                    },
                }),
            });

            // Assert
            expect(res.status).toBe(200);
            expect(mockUpdateItemStatus).toHaveBeenCalledWith(
                expect.objectContaining({ statusLabel: 'Not Started' })
            );
        });

        it('handles empty subitems array (sets to "Shipped")', async () => {
            // Arrange
            mockGetItemStatus.mockResolvedValue('In Progress');
            mockGetSubitemsWithStatus.mockResolvedValue([]);

            // Act
            const res = await app.request('/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: {
                        boardId: 18400830997,
                        pulseId: 1772139123,
                        columnId: 'color_mm0qcgc2',
                        columnType: 'color',
                        value: { label: { index: 3, text: 'Shipped' } },
                        type: 'update_column_value',
                        parentItemId: '1771812716',
                        parentItemBoardId: 1771812698,
                    },
                }),
            });

            // Assert
            expect(res.status).toBe(200);
            expect(mockUpdateItemStatus).toHaveBeenCalledWith(
                expect.objectContaining({ statusLabel: 'Shipped' })
            );
        });
    });

    describe('Error handling', () => {
        it('returns 500 when getSubitemsWithStatus fails', async () => {
            // Arrange
            mockGetItemStatus.mockResolvedValue('In Progress');
            mockGetSubitemsWithStatus.mockRejectedValue(new Error('Monday API error'));

            // Act
            const res = await app.request('/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: {
                        boardId: 18400830997,
                        pulseId: 1772139123,
                        columnId: 'color_mm0qcgc2',
                        columnType: 'color',
                        value: { label: { index: 3, text: 'Shipped' } },
                        type: 'update_column_value',
                        parentItemId: '1771812716',
                        parentItemBoardId: 1771812698,
                    },
                }),
            });

            // Assert
            expect(res.status).toBe(500);
            const body = await res.json();
            expect(body.error).toBe('Failed to process webhook');
        });

        it('returns 500 when updateItemStatus fails', async () => {
            // Arrange
            mockGetItemStatus.mockResolvedValue('In Progress');
            mockGetSubitemsWithStatus.mockResolvedValue([
                { id: 'sub1', statusLabel: 'Shipped' },
            ]);
            mockUpdateItemStatus.mockRejectedValue(new Error('Monday API error'));

            // Act
            const res = await app.request('/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: {
                        boardId: 18400830997,
                        pulseId: 1772139123,
                        columnId: 'color_mm0qcgc2',
                        columnType: 'color',
                        value: { label: { index: 3, text: 'Shipped' } },
                        type: 'update_column_value',
                        parentItemId: '1771812716',
                        parentItemBoardId: 1771812698,
                    },
                }),
            });

            // Assert
            expect(res.status).toBe(500);
            const body = await res.json();
            expect(body.error).toBe('Failed to process webhook');
        });
    });

    describe('Order Complete Date', () => {
        it('sets Order Complete Date when transitioning to "Shipped"', async () => {
            // Arrange
            mockGetItemStatus.mockResolvedValue('In Progress');
            mockGetSubitemsWithStatus.mockResolvedValue([
                { id: 'sub1', statusLabel: 'Shipped' },
                { id: 'sub2', statusLabel: 'Shipped' },
            ]);

            // Act
            const res = await app.request('/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: {
                        boardId: 18400830997,
                        pulseId: 1772139123,
                        columnId: 'color_mm0qcgc2',
                        columnType: 'color',
                        value: { label: { index: 3, text: 'Shipped' } },
                        type: 'update_column_value',
                        parentItemId: '1771812716',
                        parentItemBoardId: 1771812698,
                    },
                }),
            });

            // Assert
            expect(res.status).toBe(200);
            expect(mockUpdateItemDate).toHaveBeenCalled();
        });

        it('does NOT set Order Complete Date when already "Shipped"', async () => {
            // Arrange
            mockGetItemStatus.mockResolvedValue('Shipped');
            mockGetSubitemsWithStatus.mockResolvedValue([
                { id: 'sub1', statusLabel: 'Shipped' },
                { id: 'sub2', statusLabel: 'Shipped' },
            ]);

            // Act
            const res = await app.request('/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: {
                        boardId: 18400830997,
                        pulseId: 1772139123,
                        columnId: 'color_mm0qcgc2',
                        columnType: 'color',
                        value: { label: { index: 3, text: 'Shipped' } },
                        type: 'update_column_value',
                        parentItemId: '1771812716',
                        parentItemBoardId: 1771812698,
                    },
                }),
            });

            // Assert
            expect(res.status).toBe(200);
            expect(mockUpdateItemDate).not.toHaveBeenCalled();
        });

        it('does NOT set Order Complete Date when not "Shipped"', async () => {
            // Arrange
            mockGetItemStatus.mockResolvedValue('Not Started');
            mockGetSubitemsWithStatus.mockResolvedValue([
                { id: 'sub1', statusLabel: 'In Progress' },
                { id: 'sub2', statusLabel: 'Not Started' },
            ]);

            // Act
            const res = await app.request('/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: {
                        boardId: 18400830997,
                        pulseId: 1772139123,
                        columnId: 'color_mm0qcgc2',
                        columnType: 'color',
                        value: { label: { index: 3, text: 'In Progress' } },
                        type: 'update_column_value',
                        parentItemId: '1771812716',
                        parentItemBoardId: 1771812698,
                    },
                }),
            });

            // Assert
            expect(res.status).toBe(200);
            expect(mockUpdateItemDate).not.toHaveBeenCalled();
        });

        it('sets Order Complete Date when transitioning from "Not Started" to "Shipped"', async () => {
            // Arrange
            mockGetItemStatus.mockResolvedValue('Not Started');
            mockGetSubitemsWithStatus.mockResolvedValue([
                { id: 'sub1', statusLabel: 'Shipped' },
                { id: 'sub2', statusLabel: 'Shipped' },
            ]);

            // Act
            const res = await app.request('/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: {
                        boardId: 18400830997,
                        pulseId: 1772139123,
                        columnId: 'color_mm0qcgc2',
                        columnType: 'color',
                        value: { label: { index: 3, text: 'Shipped' } },
                        type: 'update_column_value',
                        parentItemId: '1771812716',
                        parentItemBoardId: 1771812698,
                    },
                }),
            });

            // Assert
            expect(res.status).toBe(200);
            expect(mockUpdateItemDate).toHaveBeenCalled();
        });
    });
});
