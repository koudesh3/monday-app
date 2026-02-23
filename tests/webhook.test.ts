import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSubitemsWithStatus = vi.fn();
const mockUpdateItemStatus = vi.fn();

vi.mock('@mondaycom/apps-sdk', () => ({
    Logger: class {
        info() {}
        error() {}
        warn() {}
        debug() {}
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

vi.mock('../src/server/mondayClient', () => ({
    createItem: vi.fn(),
    createSubitem: vi.fn(),
    getSubitemsWithStatus: (...args: any[]) => mockGetSubitemsWithStatus(...args),
    updateItemStatus: (...args: any[]) => mockUpdateItemStatus(...args),
}));

import { app } from '../src/server/server';

describe('Webhook API', () => {
    beforeEach(() => {
        mockGetSubitemsWithStatus.mockReset();
        mockUpdateItemStatus.mockReset();
    });

    describe('Challenge handshake', () => {
        it('returns challenge value when present in request body', async () => {
            const res = await app.request('/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ challenge: 'test-challenge-123' }),
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body).toEqual({ challenge: 'test-challenge-123' });
            expect(mockGetSubitemsWithStatus).not.toHaveBeenCalled();
        });
    });

    describe('Event filtering', () => {
        it('ignores events with non-status columnId', async () => {
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
                        parentItemBoardId: '1771812698',
                    },
                }),
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body).toEqual({ ok: true });
            expect(mockGetSubitemsWithStatus).not.toHaveBeenCalled();
        });

        it('returns ok when event object is missing', async () => {
            const res = await app.request('/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body).toEqual({ ok: true });
        });
    });

    describe('Status rollup logic', () => {
        it('sets parent to "Not Started" when any subitem is "Not Started"', async () => {
            mockGetSubitemsWithStatus.mockResolvedValue([
                { id: 'sub1', statusLabel: 'Shipped' },
                { id: 'sub2', statusLabel: 'Not Started' },
                { id: 'sub3', statusLabel: 'In Progress' },
            ]);

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
                        parentItemBoardId: '1771812698',
                    },
                }),
            });

            expect(res.status).toBe(200);
            expect(mockUpdateItemStatus).toHaveBeenCalledWith({
                boardId: '1771812698',
                itemId: '1771812716',
                statusColumnId: 'status',
                statusLabel: 'Not Started',
            });
        });

        it('sets parent to "Backordered" when any subitem is "Backordered" and none are "Not Started"', async () => {
            mockGetSubitemsWithStatus.mockResolvedValue([
                { id: 'sub1', statusLabel: 'Shipped' },
                { id: 'sub2', statusLabel: 'Backordered' },
                { id: 'sub3', statusLabel: 'In Progress' },
            ]);

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
                        parentItemBoardId: '1771812698',
                    },
                }),
            });

            expect(res.status).toBe(200);
            expect(mockUpdateItemStatus).toHaveBeenCalledWith({
                boardId: '1771812698',
                itemId: '1771812716',
                statusColumnId: 'status',
                statusLabel: 'Backordered',
            });
        });

        it('sets parent to "In Progress" when any subitem is "In Progress" and none are "Not Started" or "Backordered"', async () => {
            mockGetSubitemsWithStatus.mockResolvedValue([
                { id: 'sub1', statusLabel: 'Shipped' },
                { id: 'sub2', statusLabel: 'In Progress' },
                { id: 'sub3', statusLabel: 'Shipped' },
            ]);

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
                        parentItemBoardId: '1771812698',
                    },
                }),
            });

            expect(res.status).toBe(200);
            expect(mockUpdateItemStatus).toHaveBeenCalledWith({
                boardId: '1771812698',
                itemId: '1771812716',
                statusColumnId: 'status',
                statusLabel: 'In Progress',
            });
        });

        it('sets parent to "Shipped" when all subitems are "Shipped"', async () => {
            mockGetSubitemsWithStatus.mockResolvedValue([
                { id: 'sub1', statusLabel: 'Shipped' },
                { id: 'sub2', statusLabel: 'Shipped' },
                { id: 'sub3', statusLabel: 'Shipped' },
            ]);

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
                        parentItemBoardId: '1771812698',
                    },
                }),
            });

            expect(res.status).toBe(200);
            expect(mockUpdateItemStatus).toHaveBeenCalledWith({
                boardId: '1771812698',
                itemId: '1771812716',
                statusColumnId: 'status',
                statusLabel: 'Shipped',
            });
        });

        it('handles null status labels gracefully (treats as "Shipped")', async () => {
            mockGetSubitemsWithStatus.mockResolvedValue([
                { id: 'sub1', statusLabel: null },
                { id: 'sub2', statusLabel: null },
            ]);

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
                        parentItemBoardId: '1771812698',
                    },
                }),
            });

            expect(res.status).toBe(200);
            expect(mockUpdateItemStatus).toHaveBeenCalledWith({
                boardId: '1771812698',
                itemId: '1771812716',
                statusColumnId: 'status',
                statusLabel: 'Shipped',
            });
        });

        it('handles empty subitems array (sets to "Shipped")', async () => {
            mockGetSubitemsWithStatus.mockResolvedValue([]);

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
                        parentItemBoardId: '1771812698',
                    },
                }),
            });

            expect(res.status).toBe(200);
            expect(mockUpdateItemStatus).toHaveBeenCalledWith({
                boardId: '1771812698',
                itemId: '1771812716',
                statusColumnId: 'status',
                statusLabel: 'Shipped',
            });
        });
    });

    describe('Monday API integration', () => {
        it('queries subitems with correct parameters', async () => {
            mockGetSubitemsWithStatus.mockResolvedValue([
                { id: 'sub1', statusLabel: 'Shipped' },
            ]);

            await app.request('/webhook', {
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
                        parentItemBoardId: '1771812698',
                    },
                }),
            });

            expect(mockGetSubitemsWithStatus).toHaveBeenCalledWith({
                parentItemId: '1771812716',
                statusColumnId: 'color_mm0qcgc2',
            });
        });
    });

    describe('Error handling', () => {
        it('returns 500 when getSubitemsWithStatus fails', async () => {
            mockGetSubitemsWithStatus.mockRejectedValue(new Error('Monday API error'));

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
                        parentItemBoardId: '1771812698',
                    },
                }),
            });

            expect(res.status).toBe(500);
            const body = await res.json();
            expect(body.error).toBe('Failed to process webhook');
        });

        it('returns 500 when updateItemStatus fails', async () => {
            mockGetSubitemsWithStatus.mockResolvedValue([
                { id: 'sub1', statusLabel: 'Shipped' },
            ]);
            mockUpdateItemStatus.mockRejectedValue(new Error('Monday API error'));

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
                        parentItemBoardId: '1771812698',
                    },
                }),
            });

            expect(res.status).toBe(500);
            const body = await res.json();
            expect(body.error).toBe('Failed to process webhook');
        });
    });
});
