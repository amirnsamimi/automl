export const IMAGE_SIZES = { main: 1000, lifestyle: 1200 } as const;

const ASSET_PATTERN = /^selected\/([a-z0-9-]+)\/(main|lifestyle)\.png$/;

export function publicAssetPath(assetPath: string) {
  const match = ASSET_PATTERN.exec(assetPath);
  if (!match) throw new Error(`Unexpected asset path: ${assetPath}`);
  const [, model, role] = match;
  return {
    src: `/cars/${model}/${role}.webp`,
    size: IMAGE_SIZES[role as keyof typeof IMAGE_SIZES],
  };
}
