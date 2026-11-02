import { useEffect, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import trapDialogFocus from '../../components/trapDialogFocus'
import { stations, stationNumber } from '../../data/stations'
import { BONUS_POLICY } from './bonusModel'
import { awardedPieceIds } from './bonusPresentation'
import { questionsForQuiz, sourcesForQuestion, validQuestionSet } from './museumQuestionSelection'
import './BonusDialog.css'

function QuizQuestion({ quiz, questions, onSubmit }) {
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const errorNotice = useRef(null)
  const locked = useRef(false)
  const question = questions[quiz.step]
  const easy = quiz.consecutiveWrong >= BONUS_POLICY.easyAfterWrong
  function choose(index) { locked.current = false; setSelected(index); setError('') }
  function confirm() {
    if (selected === null || locked.current) return
    locked.current = true
    const correct = selected === question.correct
    const result = onSubmit(correct, question)
    if (result?.ok === false) { locked.current = false; setError(result.message); return }
    if (!correct) { setError(`再看看提示：${question.hint}`); setSelected(null); requestAnimationFrame(() => errorNotice.current?.focus()) }
  }
  return <div className="bonus-popup-question">
    <ol className="bonus-popup-steps" aria-label="三題挑戰進度">{questions.map((_, index) => <li key={index} className={index < quiz.step ? 'is-done' : index === quiz.step ? 'is-current' : ''} aria-current={index === quiz.step ? 'step' : undefined}><span>{index < quiz.step ? <Icon name="check" size={15}/> : index + 1}</span><small>{index < quiz.step ? '已答對' : index === quiz.step ? '作答中' : '待作答'}</small></li>)}</ol>
    <p className="bonus-popup-kicker">{question.stationName || '接續中的玩法題'}・第 {quiz.step + 1}／{questions.length} 題{easy ? '・簡單版本' : ''}</p>
    <h3 tabIndex={-1} data-bonus-focus>{easy ? question.easyTitle : question.title}</h3>
    {easy && <p className="bonus-popup-hint"><Icon name="info" size={18}/><span>{question.hint}</span></p>}
    <div className="bonus-popup-options" role="group" aria-label="選擇一個答案">{(easy ? question.easyChoices : question.choices).map((choice, index) => <button key={choice} type="button" aria-pressed={selected === index} onClick={() => choose(index)}><span className="bonus-option-letter">{String.fromCharCode(65 + index)}</span><span>{choice}</span>{selected === index && <Icon name="check" size={19}/>}</button>)}</div>
    <p ref={errorNotice} tabIndex={-1} className="bonus-popup-error" role="alert">{error}</p>
    <button className="bonus-popup-primary" type="button" disabled={selected === null} onClick={confirm}>確認答案<Icon name="arrow" size={18}/></button>
  </div>
}

function QuestionSources({ question }) {
  const sources = sourcesForQuestion(question)
  if (!sources.length) return null
  return <div className="bonus-popup-sources"><p>小知識來源</p>{sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.publisher}｜{source.title}<Icon name="arrow" size={14}/><span className="sr-only">（另開分頁）</span></a>)}</div>
}

export default function BonusDialog({ bonus, onAnswer, onDraw, onClose, returnFocusId = 'bonus-title' }) {
  const dialog = useRef(null)
  const returnTrigger = useRef(null)
  const returnFocus = useRef(true)
  const busy = useRef(false)
  const [review, setReview] = useState(null)
  const [rewards, setRewards] = useState([])
  const [error, setError] = useState('')
  const phase = rewards.length ? 'result' : review ? 'review' : bonus.quiz ? 'quiz' : bonus.pendingDraw ? 'draw' : 'idle'
  const challengeQuestions = questionsForQuiz(bonus.quiz)
  const legacyQuiz = phase === 'quiz' ? !validQuestionSet(bonus.quiz) : phase === 'review' && !review.question.sourceIds?.length
  const contentNotice = phase === 'quiz' || phase === 'review' ? legacyQuiz ? '接續中的舊版玩法題；下一次挑戰將使用展區知識題。' : '依館方公開資料改寫，非館方核定題庫。' : '拼圖獎勵為本機示範，非館方正式活動。'
  const step = bonus.quiz?.step
  const easy = (bonus.quiz?.consecutiveWrong || 0) >= BONUS_POLICY.easyAfterWrong

  useEffect(() => {
    const element = dialog.current
    if (!returnTrigger.current && !element.contains(document.activeElement)) returnTrigger.current = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (!element.open) element.showModal()
    return () => {
      document.body.style.overflow = overflow
      if (element.open) element.close()
      if (returnFocus.current) requestAnimationFrame(() => { const target = returnTrigger.current?.isConnected ? returnTrigger.current : document.getElementById(returnFocusId); target?.focus({ preventScroll: true }) })
    }
  }, [returnFocusId])
  useEffect(() => {
    const frame = requestAnimationFrame(() => dialog.current?.querySelector('[data-bonus-focus]')?.focus())
    return () => cancelAnimationFrame(frame)
  }, [phase, step, easy])

  function answer(correct, question) {
    const result = onAnswer(correct)
    if (result?.ok && correct) setReview({ question, hint: question.hint, last: result.kind === 'quiz-complete' })
    return result
  }
  function draw() {
    if (busy.current) return
    busy.current = true
    const result = onDraw()
    const awarded = awardedPieceIds(result, BONUS_POLICY.totalPieces)
    if (awarded.length) { setRewards(awarded); setError('') }
    else { setError(result?.message || '目前無法確認抽取結果，請先查看拼圖收藏；不會再自動抽取。'); busy.current = false }
  }
  function collect() {
    returnFocus.current = false
    onClose('collection')
  }
  function backdrop(event) {
    if (event.target !== event.currentTarget) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
  }
  return <dialog ref={dialog} className="bonus-popup" aria-labelledby="bonus-popup-title" onKeyDown={trapDialogFocus} onCancel={event => { event.preventDefault(); onClose() }} onClick={backdrop}>
    <header className="bonus-popup-header"><div><p className="eyebrow">鐵道旅程・額外拼圖</p><h2 id="bonus-popup-title">{phase === 'result' ? '旅程的新收穫' : phase === 'draw' ? '抽取拼圖' : '三題小挑戰'}</h2></div><button type="button" className="bonus-popup-close" aria-label="關閉答題與抽取視窗" onClick={() => onClose()}><Icon name="close" size={21}/></button></header>
    {phase === 'quiz' && <QuizQuestion key={`${step}-${easy ? 'easy' : 'normal'}-${challengeQuestions[step]?.id || 'legacy'}`} quiz={bonus.quiz} questions={challengeQuestions} onSubmit={answer}/>}
    {phase === 'review' && <section className="bonus-popup-review"><span className="bonus-popup-emblem"><Icon name="check" size={35}/></span><p className="bonus-popup-kicker">{review.last ? '三題挑戰完成' : '這題答對了'}</p><h3 tabIndex={-1} data-bonus-focus>{review.last ? '線索找齊了，準備抽拼圖。' : '答得好，下一題繼續。'}</h3><p>{review.hint}</p><QuestionSources question={review.question}/><button type="button" className="bonus-popup-primary" onClick={() => setReview(null)}>{review.last ? '前往抽取拼圖' : '下一題'}<Icon name="arrow" size={18}/></button></section>}
    {phase === 'draw' && <section className="bonus-popup-draw"><span className="bonus-popup-emblem"><Icon name="puzzle" size={42}/></span><p className="bonus-popup-kicker">答對三題・可抽取一次</p><h3 tabIndex={-1} data-bonus-focus>讓旅程，多一片新的故事。</h3><p>目前示範規則每次取得 1 片尚未收集的拼圖。抽取只增加收藏，不會替你完成實際到訪。</p><button type="button" className="bonus-popup-primary" onClick={draw}>抽取拼圖<Icon name="puzzle" size={20}/></button><p className="bonus-popup-error" role="alert">{error}</p></section>}
    {phase === 'result' && <section className="bonus-popup-result"><span className="bonus-popup-emblem"><Icon name="puzzle" size={42}/></span><p className="bonus-popup-kicker">已加入你的拼圖收藏</p><h3 tabIndex={-1} data-bonus-focus>恭喜你，抽到 {rewards.length} 片拼圖！</h3><ul className="bonus-popup-rewards">{rewards.map(id => <li key={id}><span>{stationNumber(id)}</span><div><strong>{stations.find(station => station.id === id)?.name || `第 ${id} 站拼圖`}</strong><small>答題補收・不代表實際到訪</small></div><Icon name="check" size={20}/></li>)}</ul><button type="button" className="bonus-popup-primary" onClick={collect}>查看我的拼圖<Icon name="arrow" size={18}/></button><a className="bonus-popup-secondary" href="#explore">繼續探索</a></section>}
    {phase === 'idle' && <section className="bonus-popup-review"><h3 tabIndex={-1} data-bonus-focus>進度已更新</h3><p>目前沒有進行中的挑戰或待抽取機會，請先查看拼圖收藏。</p><button type="button" className="bonus-popup-primary" onClick={collect}>查看我的拼圖</button></section>}
    <footer className="bonus-popup-footer">
      {bonus.sessionOnly && <p className="bonus-popup-storage-warning" role="status">目前無法儲存，關閉頁面後可能遺失本次進度。</p>}
      <details className="bonus-popup-rules">
        <summary><Icon name="info" size={16}/><span>答題規則</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
        <div className="bonus-popup-rules-body">
          <ul>
            <li><strong>怎麼挑戰：</strong>選好答案再確認，依序答對 3 題，就能抽取 1 次拼圖。</li>
            <li><strong>答錯怎麼辦：</strong>可依提示重試；連續答錯 {BONUS_POLICY.easyAfterWrong} 次會切換簡單版。不扣拼圖，也不增加抽取次數。</li>
            <li><strong>中途離開：</strong>{bonus.sessionOnly ? '目前儲存受限，僅保留本次進度。' : '可隨時關閉，已儲存的題次與待抽機會可接續；尚未確認的選項不算已作答。'}</li>
            {phase === 'result' && <li><strong>抽取結果：</strong>依實際核發顯示；多片獎勵規則尚未定案。</li>}
          </ul>
          <p className="bonus-popup-rule-origin">{contentNotice}</p>
        </div>
      </details>
    </footer>
  </dialog>
}
