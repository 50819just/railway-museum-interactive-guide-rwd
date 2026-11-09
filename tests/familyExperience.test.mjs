import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { partyFromEntry, familyQuestionPresentation } from '../src/features/family-experience/familyExperience.js'
import { familyCopy } from '../src/features/family-experience/familyCopy.js'
import { museumQuestions } from '../src/features/bonus/museumQuestions.js'
import { selectStationQuestionSet, questionsForQuiz, bindQuizToStation } from '../src/features/bonus/museumQuestionSelection.js'
import { initialBonus, syncBonusProgress, beginBonusChallenge, answerBonusChallenge, drawBonusPiece, normalizeBonus, readBonus } from '../src/features/bonus/bonusModel.js'

const expected = ['人事與會計','分屬不同興建時期','裝飾藝術風格','車輛與維修設備','工作採光','廠房內的空氣','鍛打成形','蒸汽鎚或空氣鎚','減少能源輸送損失','柴油動力','柴電工場','採光與通風','蝴蝶屋頂','也有其他車輛與零件業務','木造改鋼製','蒸汽與壓縮空氣','氣動工具','緊急備用電源','橫向平移','電力','使用絞盤與鋼索','車輛維修人員','兩層鋼筋混凝土建築','柴油電氣機車維修中心','機廠職工','原動室的蒸汽','先洗淨，再泡澡','用餐、集會與休閒','室內羽球場','文康中心']
test('only a valid confirmed entry enables family; groups and partial/corrupt entries do not', () => {
  for (const provider of ['google','line','guest']) assert.equal(partyFromEntry({version:1,provider,party:'family',completed:true}),'family')
  for (const record of [null,{}, {version:1,provider:'google',party:'family',completed:false}, {version:1,provider:null,party:'family',completed:true}, {version:1,provider:'google',party:'solo',completed:true}, {version:1,group:{mode:'pair'}}]) assert.equal(partyFromEntry(record),'solo')
})
test('all 30 family questions use simpler prompt and choices from first attempt with independently checked answer indices', () => {
  museumQuestions.forEach((q,i) => {
    const before=structuredClone(q), view=familyQuestionPresentation(q,{consecutiveWrong:0},'family')
    assert.equal(view.id,q.id); assert.equal(view.title,q.easyTitle); assert.deepEqual(view.choices,q.easyChoices)
    assert.equal(view.choices[view.correct],expected[i]); assert.equal(view.choices.length,2); assert.equal(view.family,true)
    assert.deepEqual(q,before)
  })
})
test('solo retains normal questions until original wrong streak threshold, with same correct index', () => {
  for (const q of museumQuestions) {
    assert.equal(familyQuestionPresentation(q,{consecutiveWrong:1},'solo').title,q.title)
    assert.equal(familyQuestionPresentation(q,{consecutiveWrong:2},'solo').title,q.easyTitle)
    assert.equal(familyQuestionPresentation(q,{consecutiveWrong:2},'solo').correct,q.correct)
  }
})
test('every station/rotation remains three local questions; family rendering does not rewrite stored snapshot', () => {
  for(let station=1;station<=10;station++) for(let round=0;round<4;round++){
    const quiz={step:1,consecutiveWrong:1,totalWrong:3,...selectStationQuestionSet(station,round)}, before=structuredClone(quiz)
    for(const q of questionsForQuiz(quiz)) { assert.equal(q.stationId,station); familyQuestionPresentation(q,quiz,'family') }
    assert.deepEqual(quiz,before); assert.equal(questionsForQuiz(quiz).length,3)
  }
})
test('family still consumes one chance and requires three correct steps; errors and repeat draws obey original policy', () => {
  const completed=[1,2,3];let s=syncBonusProgress(initialBonus(),completed).state
  s=beginBonusChallenge(s,completed,3).state;assert.equal(s.availableChances,0)
  for(let n=0;n<3;n++){const q=questionsForQuiz(s.quiz)[s.quiz.step];familyQuestionPresentation(q,s.quiz,'family');s=answerBonusChallenge(s,false).state}
  assert.equal(s.quiz.totalWrong,3);assert.equal(s.quiz.consecutiveWrong,3)
  s=normalizeBonus(s);assert.equal(s.quiz.totalWrong,3)
  for(let n=0;n<2;n++){s=answerBonusChallenge(s,true).state;assert.equal(s.pendingDraw,false)}
  s=answerBonusChallenge(s,true).state;assert.equal(s.pendingDraw,true);assert.deepEqual(s.bonusPieces,[])
  s=drawBonusPiece(s,completed,{random:()=>0}).state;assert.equal(s.drawsUsed,1);assert.deepEqual(completed,[1,2,3])
  assert.equal(drawBonusPiece(s,completed).ok,false)
})
test('legacy quiz presentation and station rebind keep existing compatibility and total mistakes', () => {
  const quiz={step:1,consecutiveWrong:1,totalWrong:4}, old=structuredClone(quiz)
  for(const q of questionsForQuiz(quiz)) assert.ok(familyQuestionPresentation(q,quiz,'family').choices.length)
  assert.deepEqual(quiz,old)
  const rebound=bindQuizToStation(quiz,8);assert.equal(rebound.step,1);assert.equal(rebound.totalWrong,4)
  assert.ok(questionsForQuiz(rebound).every(q=>q.stationId===8));assert.equal(rebound.consecutiveWrong,0)
})
test('corrupt bonus data stays byte-identical when read and rendered', () => {
  const raw='{not-json';let writes=0
  const read=readBonus({getItem:()=>raw,setItem:()=>writes++})
  assert.equal(read.sessionOnly,true);assert.equal(writes,0)
})
test('all family copy has four language coverage and age guidance does not require personal data', () => {
  const keys=Object.keys(familyCopy('zh-TW')).sort()
  for(const locale of ['en','ja','ko']){
    assert.deepEqual(Object.keys(familyCopy(locale)).sort(),keys)
    for(const value of Object.values(familyCopy(locale))) {assert.ok(value.length) }
  }
  const entry=readFileSync(new URL('../src/features/entry/EntryGate.jsx',import.meta.url),'utf8')
  assert.ok(entry.includes('fc.age'));assert.doesNotMatch(entry,/type="(?:date|number)"/)
})
test('image exists and base-safe URL, motion, focus and local-group distinction are wired', () => {
  assert.ok(existsSync(new URL('../public/images/experience-v1/family-team-v1.jpg',import.meta.url)))
  const card=readFileSync(new URL('../src/features/family-experience/FamilyTeamCard.jsx',import.meta.url),'utf8')
  assert.match(card,/import.meta.env.BASE_URL/)
  const css=readFileSync(new URL('../src/features/family-experience/familyExperience.css',import.meta.url),'utf8')
  assert.match(css,/prefers-reduced-motion/);assert.match(css,/focus-visible/)
  const group=readFileSync(new URL('../src/features/family/FamilyPage.jsx',import.meta.url),'utf8')
  assert.match(group,/fc.group/)
})

test('redemption integration shows only guidance, without changing eligibility or payment actions', () => {
  const source=readFileSync(new URL('../src/features/redemption/RedemptionDialog.jsx',import.meta.url),'utf8')
  assert.match(source,/phase !== 'cancel' && <FamilyCollectionNotice\//)
  const notice=readFileSync(new URL('../src/features/family-experience/FamilyCollectionNotice.jsx',import.meta.url),'utf8')
  assert.match(notice,/party !== 'family'/);assert.match(notice,/isGuestSession/);assert.match(notice,/HelpTip/)
  assert.doesNotMatch(notice,/submitRedemption|updateRedemption|fetch\(|localStorage\.setItem/)
})
