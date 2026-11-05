import { useEffect, useRef } from 'react'
import { localize, formatNumber } from '../../i18n/runtime.js'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'
import { productSpecifications, productVolumeCm3 } from './productSpecifications.js'
import { getProductDetailsCopy } from './productDetailsCopy.js'
import './ProductDetailsDialog.css'

// Deliberately receives no transaction handlers or writable stores.
export default function ProductDetailsDialog({ product, availability, onClose }) {
  const dialog = useRef(null)
  const closeButton = useRef(null)
  const copy = getProductDetailsCopy()
  const specs = productSpecifications[product.id]
  useEffect(() => {
    const trigger = document.activeElement
    const element = dialog.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element.showModal()
    closeButton.current?.focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = overflow
      if (element.open) element.close()
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [])
  return <dialog ref={dialog} className="product-details-dialog" aria-labelledby="product-details-title" onKeyDown={trapDialogFocus} onCancel={event => { event.preventDefault(); onClose() }}>
    <header className="product-details-header"><p className="eyebrow">{copy.details}</p><button ref={closeButton} type="button" className="product-details-close" aria-label={copy.close} onClick={onClose}><Icon name="close"/></button></header>
    <div className="product-details-content">
      {product.image && <img className="product-details-image" src={`${import.meta.env.BASE_URL}images/${product.image}`} alt={localize(product.name)} width="900" height="900"/>}
      <div className="product-details-info"><h2 id="product-details-title">{localize(product.name)}</h2>
        <section aria-labelledby="product-details-about"><h3 id="product-details-about">{copy.about}</h3><p>{localize(product.description)}</p></section>
        <section aria-labelledby="product-details-specs"><h3 id="product-details-specs">{copy.specs}</h3>{specs?.dimensions ? <><dl className="product-details-specification-list">
          <div><dt>{copy.materialLabel}</dt><dd>{copy.materials[specs.material]}</dd></div>
          <div><dt>{copy.sizeLabel}</dt><dd>{[specs.dimensions.length, specs.dimensions.width, specs.dimensions.height].map(value => formatNumber(value)).join(' × ')} cm</dd></div>
          <div><dt>{copy.volumeLabel}</dt><dd>{formatNumber(productVolumeCm3(specs))} cm³</dd></div>
        </dl><p className="product-details-note">{copy.bases[specs.basis]}</p></> : <p>{copy.pending}</p>}</section>
        <section aria-labelledby="product-details-cost"><h3 id="product-details-cost">{copy.cost}</h3>{product.id === 'revisit' ? <p>{copy.revisit}</p> : <><p>{copy.terms}</p><p className="product-details-price">{product.fee === 0 ? copy.free : `${copy.fee} NT$${product.fee}`}</p>{product.priceNote && <p>{copy.pricePending}</p>}</>}</section>
        {product.id !== 'revisit' && <section aria-labelledby="product-details-availability"><h3 id="product-details-availability">{copy.availability}</h3><p>{copy.statuses[availability?.status] || copy.unknown}</p><p className="product-details-note">{copy.localStatus}</p></section>}
        <p className="product-details-notice">{copy.readOnly}</p>
      </div>
    </div>
  </dialog>
}
