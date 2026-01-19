import { describe, expect, it } from 'vitest';
import {
	slugFromLabel,
	parseAssetsResponse,
	nextAvailabilityValue,
	buildCreateAssetForm,
	buildEditAssetJson
} from '$lib/utils/assets-teacher';

describe('assets teacher utils', () => {
	it('slugFromLabel matches the Svelte reactive slug logic', () => {
		expect(slugFromLabel(' Tree Bench! ')).toBe('tree_bench');
		expect(slugFromLabel('Glijbaan 3000')).toBe('glijbaan_3000');
		expect(slugFromLabel('A__B')).toBe('a__b');
	});

	it('parseAssetsResponse supports array and {data: []}', () => {
		expect(parseAssetsResponse([{ id: 1 } as any])).toEqual([{ id: 1 }]);
		expect(parseAssetsResponse({ data: [{ id: 2 }] } as any)).toEqual([{ id: 2 }]);
		expect(parseAssetsResponse({ nope: true } as any)).toEqual([]);
		expect(parseAssetsResponse(null)).toEqual([]);
	});

	it('nextAvailabilityValue follows toggleAvailability logic (including default)', () => {
		expect(nextAvailabilityValue()).toBe(0); // default: undefined -> true -> 0
		expect(nextAvailabilityValue(true)).toBe(0);
		expect(nextAvailabilityValue(false)).toBe(1);
	});

	it('buildEditAssetJson creates the right PATCH payload', () => {
		expect(
			buildEditAssetJson({ label: '  Tree  ', width: 2, height: 3, isAvailable: true })
		).toEqual({ label: 'Tree', width: 2, height: 3, is_available: 1 });

		expect(buildEditAssetJson({ label: 'Bench', width: 1, height: 1, isAvailable: false })).toEqual(
			{ label: 'Bench', width: 1, height: 1, is_available: 0 }
		);
	});

	it('buildCreateAssetForm builds FormData correctly', () => {
		const file = new File(['x'], 'x.png', { type: 'image/png' });

		const form = buildCreateAssetForm({
			slug: 'tree',
			label: ' Tree ',
			width: 2,
			height: 3,
			isAvailable: true,
			image: file
		});

		expect(form.get('slug')).toBe('tree');
		expect(form.get('label')).toBe('Tree');
		expect(form.get('width')).toBe('2');
		expect(form.get('height')).toBe('3');
		expect(form.get('is_available')).toBe('1');

		const img = form.get('image');
		expect(img).toBeInstanceOf(File);
		expect((img as File).name).toBe('x.png');
	});
});
