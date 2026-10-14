import fs from "node:fs";
import path from "node:path";

import * as THREE from "three";

import { ASSETS } from "../src/config/assets.js";
import {
  getLevelEditorAdapter,
  getSupportedLevelIds
} from "../src/editor/levels/index.js";
import { getLevelObjects } from "./lib/levelCatalog.js";

const PROJECT_ROOT = process.cwd();
const MAX_LEVEL_WARNING_EXAMPLES = 20;
const MAX_GLOBAL_WARNING_EXAMPLES = 30;
const USAGE_TEXT = "node scripts/validate-editor-sync.js <level_id|all> [--pretty]";
const HELP_TEXT = `Usage: ${USAGE_TEXT}\n\nExamples:\n  npm run tools:validate-editor-sync -- level_two --pretty\n  npm run tools:validate-editor-sync -- all --pretty`;

function isHelp(args) {
  return args.includes("--help") || args.includes("-h");
}

function parseArgs() {
  const args = process.argv.slice(2);
  const levelId = args.find((arg) => !arg.startsWith("-")) || "all";
  const pretty = args.includes("--pretty");
  const unknown = args.filter((arg) => arg.startsWith("-") && !["--pretty", "--help", "-h"].includes(arg));
  if (unknown.length > 0) throw new Error(`Unexpected flag: ${unknown.join(", ")}. Usage: ${USAGE_TEXT}`);
  return { levelId, pretty };
}

function makeStubAsset(assetKey = "asset") {
  const group = new THREE.Group();
  group.name = assetKey;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x9ab7a8 })
  );
  mesh.name = `${assetKey} stub mesh`;
  group.add(mesh);
  return group;
}

function placeStubAsset(group, assetKey, point = {}, options = {}) {
  const object = makeStubAsset(assetKey);
  object.position.set(point.x || 0, options.y || point.y || 0, point.z || 0);
  object.rotation.y = options.rotationY || 0;
  if (options.scale !== undefined) {
    if (typeof options.scale === "number") object.scale.setScalar(options.scale);
    else object.scale.set(options.scale.x || 1, options.scale.y || 1, options.scale.z || 1);
  }
  group.add(object);
  return object;
}

function validateSourceRef(sourceRef, recordId) {
  const errors = [];
  const warnings = [];
  if (!sourceRef) return { errors, warnings };
  if (!sourceRef.file || !sourceRef.exportName) {
    errors.push({
      code: "incomplete_source_ref",
      recordId,
      sourceRef
    });
    return { errors, warnings };
  }
  const filePath = path.join(PROJECT_ROOT, sourceRef.file);
  if (!fs.existsSync(filePath)) {
    errors.push({
      code: "source_ref_file_missing",
      recordId,
      file: sourceRef.file
    });
    return { errors, warnings };
  }
  const source = fs.readFileSync(filePath, "utf8");
  const exportRoot = String(sourceRef.exportName).split(".")[0];
  if (!source.includes(sourceRef.exportName) && !source.includes(exportRoot)) {
    errors.push({
      code: "source_ref_export_missing",
      recordId,
      file: sourceRef.file,
      exportName: sourceRef.exportName
    });
  }
  if (/\[\d+\]/.test(String(sourceRef.path || ""))) {
    warnings.push({
      code: "array_index_source_ref",
      recordId,
      file: sourceRef.file,
      exportName: sourceRef.exportName,
      path: sourceRef.path,
      message: "Array-index-only source identity can drift when level data is reordered."
    });
  }
  return { errors, warnings };
}

function expectedRecordIdsForLink(levelId, id) {
  if (!id) return [];
  return [
    id,
    `${levelId}.${id}`,
    `${levelId}.${String(id).replaceAll("_", "-")}`,
    `${levelId}.${String(id).replaceAll("-", "_")}`
  ];
}

function validateMechanismLinks({ levelId, records, proxies }) {
  const errors = [];
  const warnings = [];
  const recordIds = new Set(records.map((record) => record.id));
  proxies.forEach((proxy) => {
    const linkedIds = [
      proxy.metadata?.linkedPlatformId,
      proxy.metadata?.linkedButtonId
    ].filter(Boolean);
    linkedIds.forEach((linkedId) => {
      const candidates = expectedRecordIdsForLink(levelId, linkedId);
      if (!candidates.some((candidate) => recordIds.has(candidate))) {
        warnings.push({
          code: "mechanism_link_target_not_editor_mapped",
          proxyId: proxy.id,
          linkedId,
          candidates
        });
      }
    });
  });
  return { errors, warnings };
}

function validateAssetKeys(records) {
  const warnings = [];
  records.forEach((record) => {
    const assetKey = record.assetKey || "";
    if (!assetKey || ASSETS[assetKey]) return;
    if (record.generated || record.readOnly || assetKey.startsWith("generated-")) return;
    warnings.push({
      code: "asset_key_not_in_registry",
      recordId: record.id,
      assetKey
    });
  });
  return warnings;
}

function validateCatalogCoverage(levelId, records) {
  const warnings = [];
  const levelObjects = getLevelObjects(levelId);
  const recordAssetKeys = new Set(records.map((record) => record.assetKey).filter(Boolean));
  levelObjects
    .filter((object) => object.asset?.key && ASSETS[object.asset.key])
    .forEach((object) => {
      if (recordAssetKeys.has(object.asset.key)) return;
      warnings.push({
        code: "catalog_object_asset_not_in_editor_records",
        objectId: object.id,
        assetKey: object.asset.key,
        message: "Tooling catalog object uses an asset key not represented in editor records."
      });
    });
  return warnings.slice(0, 24);
}

function validateLevel(levelId) {
  const adapter = getLevelEditorAdapter(levelId);
  if (!adapter) {
    return {
      levelId,
      ok: false,
      errors: [{ code: "editor_adapter_missing", levelId }],
      warnings: []
    };
  }

  const level = adapter.buildEditorScene({
    cloneAsset: makeStubAsset,
    placeAsset: placeStubAsset
  });
  const records = level.editableObjects || [];
  const proxies = level.colliderProxies || [];
  const errors = [];
  const warnings = [];
  const seenIds = new Map();

  records.forEach((record) => {
    if (!record.id) {
      errors.push({ code: "record_id_missing", name: record.name || "" });
      return;
    }
    if (seenIds.has(record.id)) {
      errors.push({ code: "duplicate_editor_record_id", recordId: record.id });
    }
    seenIds.set(record.id, record);
    const sourceResult = validateSourceRef(record.sourceRef, record.id);
    errors.push(...sourceResult.errors);
    warnings.push(...sourceResult.warnings);
  });

  const recordIds = new Set(records.map((record) => record.id));
  proxies.forEach((proxy) => {
    if (proxy.ownerId && !recordIds.has(proxy.ownerId)) {
      errors.push({
        code: "collider_proxy_owner_missing",
        proxyId: proxy.id,
        ownerId: proxy.ownerId
      });
    }
    const sourceResult = validateSourceRef(proxy.sourceRef, proxy.id);
    errors.push(...sourceResult.errors);
    warnings.push(...sourceResult.warnings);
  });

  warnings.push(...validateAssetKeys(records));
  warnings.push(...validateCatalogCoverage(levelId, records));
  const linkResult = validateMechanismLinks({ levelId, records, proxies });
  errors.push(...linkResult.errors);
  warnings.push(...linkResult.warnings);

  const warningCountsByCode = warnings.reduce((counts, warning) => {
    counts[warning.code] = (counts[warning.code] || 0) + 1;
    return counts;
  }, {});

  return {
    levelId,
    ok: errors.length === 0,
    recordCount: records.length,
    proxyCount: proxies.length,
    sourceBackedRecordCount: records.filter((record) => record.sourceBacked || record.sourceRef).length,
    errorCount: errors.length,
    warningCount: warnings.length,
    warningCountsByCode,
    errors,
    warnings: warnings.slice(0, MAX_LEVEL_WARNING_EXAMPLES),
    warningsTruncated: warnings.length > MAX_LEVEL_WARNING_EXAMPLES
  };
}

function run() {
  const args = process.argv.slice(2);
  if (isHelp(args)) {
    console.log(HELP_TEXT);
    return;
  }
  const { levelId, pretty } = parseArgs();
  const levelIds = levelId === "all" ? getSupportedLevelIds() : [levelId];
  const levels = levelIds.map(validateLevel);
  const errors = levels.flatMap((level) => level.errors.map((error) => ({ levelId: level.levelId, ...error })));
  const warnings = levels.flatMap((level) => level.warnings.map((warning) => ({ levelId: level.levelId, ...warning })));
  const warningCount = levels.reduce((sum, level) => sum + level.warningCount, 0);
  const payload = {
    ok: errors.length === 0,
    command: "validate-editor-sync",
    levelId,
    checkedLevelIds: levelIds,
    summary: {
      levelCount: levels.length,
      recordCount: levels.reduce((sum, level) => sum + (level.recordCount || 0), 0),
      proxyCount: levels.reduce((sum, level) => sum + (level.proxyCount || 0), 0),
      errorCount: errors.length,
      warningCount
    },
    levels,
    errors,
    warnings: warnings.slice(0, MAX_GLOBAL_WARNING_EXAMPLES),
    warningsTruncated: warningCount > warnings.length || warnings.length > MAX_GLOBAL_WARNING_EXAMPLES
  };
  console.log(pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload));
  if (!payload.ok) process.exit(1);
}

run();
