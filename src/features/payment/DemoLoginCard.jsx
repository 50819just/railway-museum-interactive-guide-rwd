import { t, localize } from '../../i18n/runtime.js'
import Icon from '../../components/Icon'
import { useState } from 'react'
import { DEMO_ACCOUNT, DEMO_PASSWORD } from './paymentDemoModel.mjs'
import usePaymentDemo, { updatePaymentDemo } from './paymentDemoStore.mjs'
import './PaymentDemo.css'

export default function DemoLoginCard({ onSuccess }) {
  const { state } = usePaymentDemo()
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  function login(event) {
    event.preventDefault()
    if (!updatePaymentDemo({ type: 'login', account, password })) { setError('帳號或密碼不正確，請使用下方測試帳號。'); return }
    setPassword(''); setError(''); onSuccess()
  }
  return <section className="payment-demo-login" aria-labelledby="demo-login-title"><p className="eyebrow">{t('paymentDemo.accountEyebrow')}</p><h2 id="demo-login-title">{t('demoLoginCard.demo.login.title.text')}</h2><p>{t('demoLoginCard.p.text')}</p>
    {state.authenticated ? <><p className="pd-login-status">{t('demoLoginCard.pd.login.status.text', { value1: localize(DEMO_ACCOUNT) })}<span>{t('demoLoginCard.span.text')}</span></p><button type="button" className="pd-primary family-primary" onClick={onSuccess}>{t('demoLoginCard.pd.primary.text')}<Icon name="arrow" size={16}/></button><button type="button" className="pd-text-button" onClick={() => updatePaymentDemo({ type: 'logout' })}>{t('demoLoginCard.pd.text.button.text')}</button></> : <form onSubmit={login}><label>{t('demoLoginCard.label.text')}<input name="demo-account" autoComplete="off" autoCapitalize="none" spellCheck={false} value={account} onChange={e => setAccount(e.target.value)} required/></label><label>{t('demoLoginCard.label.text.2')}<input name="demo-password" type="password" autoComplete="off" value={password} onChange={e => setPassword(e.target.value)} required/></label>{error && <p className="pd-error" role="alert">{localize(error)}</p>}<button type="submit" className="pd-primary family-primary">{t('demoLoginCard.pd.primary.text.2')}</button></form>}
    <p className="pd-credentials-hint">{t('demoLoginCard.pd.credentials.hint.text')}<code>{localize(DEMO_ACCOUNT)}</code><span aria-hidden="true"> ／ </span>{t('demoLoginCard.pd.credentials.hint.text.2')}<code>{localize(DEMO_PASSWORD)}</code></p><small className="pd-scope-note">{t('demoLoginCard.pd.scope.note.text')}</small>
  </section>
}
