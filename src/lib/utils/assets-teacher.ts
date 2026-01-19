export type Asset = {
  id: number;
  slug: string;
  label: string;
  image_url: string;
  width: number;
  height: number;
  is_available?: boolean;
};

export function slugFromLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function parseAssetsResponse(data: any): Asset[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export function nextAvailabilityValue(current?: boolean): 0 | 1 {
  const currentBool = current ?? true; // your code: default true if undefined
  return currentBool ? 0 : 1;
}

export function buildCreateAssetForm(args: {
  slug: string;
  label: string;
  width: number;
  height: number;
  isAvailable: boolean;
  image: File;
}): FormData {
  const form = new FormData();
  form.append('slug', args.slug);
  form.append('label', args.label.trim());
  form.append('width', String(args.width));
  form.append('height', String(args.height));
  form.append('is_available', args.isAvailable ? '1' : '0');
  form.append('image', args.image);
  return form;
}

export function buildEditAssetJson(args: {
  label: string;
  width: number;
  height: number;
  isAvailable: boolean;
}) {
  return {
    label: args.label.trim(),
    width: args.width,
    height: args.height,
    is_available: args.isAvailable ? 1 : 0
  };
  
}