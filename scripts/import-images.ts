import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { IMAGE_SIZES } from "../lib/images";

const zipPath =
  process.argv[2] ??
  process.env.CAR_IMAGES_ZIP ??
  path.join(process.env.HOME ?? "", "Documents/invitations/Auto-ML-All-Car-Images.zip");

const cacheDir = path.resolve(".cache/car-images");
const outDir = path.resolve("public/cars");

async function main() {
  if (!existsSync(zipPath)) {
    throw new Error(`Image archive not found: ${zipPath}. Pass the path as the first argument.`);
  }

  rmSync(cacheDir, { recursive: true, force: true });
  mkdirSync(cacheDir, { recursive: true });
  execFileSync("unzip", ["-q", "-o", zipPath, "selected/*", "-d", cacheDir], { stdio: "inherit" });

  const selectedDir = path.join(cacheDir, "selected");
  const models = readdirSync(selectedDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  let count = 0;

  for (const model of models) {
    const target = path.join(outDir, model.name);
    mkdirSync(target, { recursive: true });

    for (const role of ["main", "lifestyle"] as const) {
      const source = path.join(selectedDir, model.name, `${role}.png`);
      if (!existsSync(source)) {
        console.warn(`missing ${model.name}/${role}.png`);
        continue;
      }
      const size = IMAGE_SIZES[role];
      await sharp(source)
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: role === "main" ? 85 : 78, alphaQuality: 90, effort: 5 })
        .toFile(path.join(target, `${role}.webp`));
      count++;
    }
  }

  rmSync(cacheDir, { recursive: true, force: true });
  console.log(`converted ${count} images into ${path.relative(process.cwd(), outDir)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
