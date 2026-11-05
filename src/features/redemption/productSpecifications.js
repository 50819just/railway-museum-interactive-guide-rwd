// User-authorized project design specifications, not supplier measurements or official museum data.
// These values define the project's product designs; verified source fields intentionally remain empty.
export const specificationReview = Object.freeze({
  reviewedAt: '2026-11-05',
  sourceCheckedAt: '2026-10-30',
  sources: Object.freeze(['docs/OFFICIAL_PRODUCT_CHECK_2026-10-30.md', 'src/features/redemption/redemptionSources.js', 'src/features/redemption/redemptionCatalog.js']),
  status: 'user-authorized-design-specifications',
  decision: 'User requested reasonable project-defined materials and L × W × H with bounding-box volume instead of pending specifications.',
})
const design = (material, length, width, height, basis) => Object.freeze({
  material, dimensions: Object.freeze({ length, width, height, unit: 'cm' }), basis,
  status: 'project-design-specification', sourceUrl: null, verifiedAt: null,
})
export const productSpecifications = Object.freeze({
  transparent: design('transparentWood', 18, 8, 20, 'assembled'),
  'ticket-keyring': design('woodMetal', 6, 3, 0.5, 'bodyOnly'),
  otter: design('polyesterFill', 14, 12, 25, 'seated'),
  wooden: design('wood', 18, 6, 8, 'assembled'),
  'train-plush': design('polyesterFill', 40, 18, 20, 'full'),
  'rabbit-stationmaster': design('polyesterFill', 16, 12, 30, 'earsIncluded'),
  // The second-round item is not selected yet; do not invent a new prize or change its policy.
  revisit: Object.freeze({ material: null, dimensions: null, sourceUrl: null, verifiedAt: null }),
})
export function productVolumeCm3(specification) {
  const dimensions = specification?.dimensions
  return dimensions ? dimensions.length * dimensions.width * dimensions.height : null
}
