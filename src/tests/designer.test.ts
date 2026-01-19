import { describe, expect, it } from 'vitest';
import {
    assetSrc,
    buildDesignPayload,
    clampPosition,
    getRotatedSize,
    getStudentSessionFromRaw,
    slugFromLabel,
    type Asset
} from '$lib/utils/designer';

describe('assetSrc', () => {
    it('returns empty string for undefined', () => {
        expect(assetSrc(undefined)).toBe('');
    });

    it('keeps absolute URLs', () => {
        expect(assetSrc('https://example.com/x.png')).toBe('https://example.com/x.png');
        expect(assetSrc('http://example.com/x.png')).toBe('http://example.com/x.png');
    });

    it('normalizes missing leading slash', () => {
        expect(assetSrc('storage/a.png')).toBe('/storage/a.png');
    });

    it('prefixes same-origin storage with asset base (if provided)', () => {
        expect(assetSrc('/storage/a.png', '')).toBe('/storage/a.png');
        expect(assetSrc('/storage/a.png', ''))
            .toBe('/storage/a.png');
        expect(assetSrc('/storage/a.png', '/prefix')).toBe('/prefix/storage/a.png');
    });
});

describe('getStudentSessionFromRaw', () => {
    it('returns null on null/empty', () => {
        expect(getStudentSessionFromRaw(null)).toBeNull();
        expect(getStudentSessionFromRaw('')).toBeNull();
    });

    it('returns null on invalid JSON', () => {
        expect(getStudentSessionFromRaw('{bad json')).toBeNull();
    });

    it('returns null if required fields missing', () => {
        expect(getStudentSessionFromRaw(JSON.stringify({ class_id: 1 }))).toBeNull();
        expect(getStudentSessionFromRaw(JSON.stringify({ student_name: 'A' }))).toBeNull();
    });

    it('parses and normalizes types', () => {
        const raw = JSON.stringify({ class_id: '12', student_name: 'Shiev', code: 'ab12', created_at: '99' });
        expect(getStudentSessionFromRaw(raw)).toEqual({
            class_id: 12,
            student_name: 'Shiev',
            code: 'ab12',
            created_at: 99
        });
    });
});

describe('buildDesignPayload', () => {
    it('builds payload with uppercase class_code and placed assets mapping', () => {
        const asset: Asset = { id: 7, label: 'Tree', image_url: '/storage/t.png', width: 2, height: 3 };

        const payload = buildDesignPayload({
            rows: 18,
            cols: 22,
            backgroundImage: '/bg.jpg',
            session: { class_id: 5, student_name: 'Ana', code: 'xy9' },
            placedAssets: [
                { instanceId: 1, asset, row: 4, col: 6, rotation: 90 }
            ]
        });

        expect(payload.class_code).toBe('XY9');
        expect(payload.placedAssets).toEqual([
            {
                instanceId: 1,
                assetId: 7,
                label: 'Tree',
                row: 4,
                col: 6,
                width: 2,
                height: 3,
                rotation: 90
            }
        ]);
    });

    it('uses nulls when no session', () => {
        const payload = buildDesignPayload({
            rows: 1,
            cols: 1,
            backgroundImage: 'x',
            session: null,
            placedAssets: []
        });

        expect(payload.class_id).toBeNull();
        expect(payload.student_name).toBeNull();
        expect(payload.class_code).toBeNull();
    });
});

describe('rotation + clamping', () => {
    const asset: Asset = { id: 1, label: 'Bench', image_url: '/x', width: 3, height: 2 };

    it('getRotatedSize swaps width/height at 90/270', () => {
        expect(getRotatedSize(asset, 0)).toEqual({ width: 3, height: 2 });
        expect(getRotatedSize(asset, 90)).toEqual({ width: 2, height: 3 });
        expect(getRotatedSize(asset, 270)).toEqual({ width: 2, height: 3 });
        expect(getRotatedSize(asset, 180)).toEqual({ width: 3, height: 2 });
    });

    it('clampPosition clamps into grid bounds considering rotation', () => {
        // grid 10x10
        expect(clampPosition(9, 9, asset, 0, 10, 10)).toEqual({ row: 8, col: 7 }); // maxRow=10-2=8, maxCol=10-3=7
        expect(clampPosition(9, 9, asset, 90, 10, 10)).toEqual({ row: 7, col: 8 }); // rotated size 2x3
        expect(clampPosition(-5, -2, asset, 0, 10, 10)).toEqual({ row: 0, col: 0 });
    });
});

describe('slugFromLabel', () => {
    it('generates slug like your Svelte reactive statement', () => {
        expect(slugFromLabel(' Tree Bench! ')).toBe('tree_bench');
        expect(slugFromLabel('Glijbaan 3000')).toBe('glijbaan_3000');
        expect(slugFromLabel('A__B')).toBe('a__b');
    });


    it('handles session without optional fields', () => {
        const raw = JSON.stringify({ class_id: 1, student_name: 'X' });
        expect(getStudentSessionFromRaw(raw)).toEqual({
            class_id: 1,
            student_name: 'X',
            code: undefined,
            created_at: undefined
        });
    });

});
