// Keep destinations here so more projects can be connected without changing the menu.
// Standalone project pages are served alongside the guide, including on subpath deployments.
export const officialWebsite = { id: 'official', titleKey: 'relatedWorks.official', image: null, logo: 'nrm-official-logo-v1.png', href: 'https://www.nrm.gov.tw/' }

export const relatedWorks = [
  { id: 'virtual-tour', titleKey: 'relatedWorks.virtualTour', actionKey: 'relatedWorks.openTour', image: 'related-railway-tour-cards-v2.png', href: `${import.meta.env.BASE_URL}works/railway-park-3d-v2.html`, duelHref: `${import.meta.env.BASE_URL}works/railway-park-3d.html` },
  { id: 'little-office', titleKey: 'relatedWorks.littleOffice', image: 'related-railway-office-v2.png', href: `${import.meta.env.BASE_URL}works/railway-office-v2.html` },
]
