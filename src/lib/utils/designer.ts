// src/lib/utils/designer.ts
export type Asset = {
	id: number;
	label: string;
	image_url: string;
	width: number;
	height: number;
	is_available?: boolean | number;
	[key: string]: any;
};

export type PlacedAsset = {
	instanceId: number;
	asset: Asset;
	row: number;
	col: number;
	rotation: number;
};

export type StudentSession = {
	class_id: number;
	student_name: string;
	code?: string;
	created_at?: number;
};

export function assetSrc(url?: string, assetBase = ''): string {
	if (!url) return '';
	const u = String(url);

	if (u.startsWith('http://') || u.startsWith('https://')) return u;
	if (!u.startsWith('/')) return `/${u}`;
	return `${assetBase}${u}`;
}

export function getStudentSessionFromRaw(raw: string | null): StudentSession | null {
	try {
		if (!raw) return null;
		const s = JSON.parse(raw);
		if (!s?.class_id || !s?.student_name) return null;

		return {
			class_id: Number(s.class_id),
			student_name: String(s.student_name),
			code: s?.code ? String(s.code) : undefined,
			created_at: s?.created_at ? Number(s.created_at) : undefined
		};
	} catch {
		return null;
	}
}

export function buildDesignPayload(args: {
	rows: number;
	cols: number;
	backgroundImage: string;
	placedAssets: PlacedAsset[];
	session: StudentSession | null;
}) {
	const { rows, cols, backgroundImage, placedAssets, session } = args;

	return {
		rows,
		cols,
		backgroundImage,
		class_id: session?.class_id ?? null,
		student_name: session?.student_name ?? null,
		class_code: session?.code ? session.code.toUpperCase() : null,
		placedAssets: placedAssets.map((p) => ({
			instanceId: p.instanceId,
			assetId: p.asset.id,
			label: p.asset.label,
			row: p.row,
			col: p.col,
			width: p.asset.width,
			height: p.asset.height,
			rotation: p.rotation
		}))
	};
}

export function getRotatedSize(asset: Asset, rotation: number) {
	const normalized = ((rotation % 360) + 360) % 360;
	if (normalized === 90 || normalized === 270) {
		return { width: asset.height, height: asset.width };
	}
	return { width: asset.width, height: asset.height };
}

export function clampPosition(
	row: number,
	col: number,
	asset: Asset,
	rotation: number,
	rows: number,
	cols: number
) {
	const rotated = getRotatedSize(asset, rotation);
	const maxRow = rows - rotated.height;
	const maxCol = cols - rotated.width;

	return {
		row: Math.max(0, Math.min(row, maxRow)),
		col: Math.max(0, Math.min(col, maxCol))
	};
}

export function slugFromLabel(label: string) {
	return label
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '_')
		.replace(/[^a-z0-9_]/g, '');
}
