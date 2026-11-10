// Keep destinations here so more projects can be connected without changing the menu.
// Standalone project pages are served alongside the guide, including on subpath deployments.
export const relatedWorks = [
  { id: 'official', titleKey: 'relatedWorks.official', image: 'station-01.jpg', href: 'https://www.nrm.gov.tw/' },
  { id: 'virtual-tour', titleKey: 'relatedWorks.virtualTour', image: 'station-02.jpg', href: `${import.meta.env.BASE_URL}works/railway-park-3d.html` },
  { id: 'little-office', titleKey: 'relatedWorks.littleOffice', image: 'station-10.jpg', href: `${import.meta.env.BASE_URL}works/little-office.html` },
]
