import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { useQuery } from "convex/react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useMemo, useState } from "react"
import { EditableText } from "@/components/cms/inline-editing"
import { SectionLines } from "@/components/site/section-lines"
import { useTrack } from "@/lib/analytics"
import { useGlobalContent, useHomeContent } from "@/lib/site-content"

type QuizQuestion = {
  _id: Id<"menuQuizQuestions">
  prompt: string
  options: {
    _id: Id<"menuQuizOptions">
    label: string
  }[]
}

type QuizItem = {
  _id: Id<"menuItems">
  name: string
  description: string
  price: string
  orderUrl: string | null
  image: string | null
  quizAnswers: {
    questionId: Id<"menuQuizQuestions">
    optionId: Id<"menuQuizOptions">
  }[]
}

const EMPTY_QUESTIONS: QuizQuestion[] = []
const EMPTY_ITEMS: QuizItem[] = []

/** Pick a highest-scoring item, breaking equal scores randomly. */
function recommend(items: QuizItem[], answers: Record<string, string>): QuizItem {
  const scored = items.map((item) => ({
    item,
    score: item.quizAnswers.reduce(
      (total, answer) => total + (answers[answer.questionId] === answer.optionId ? 1 : 0),
      0,
    ),
  }))
  const highest = Math.max(...scored.map(({ score }) => score))
  const tied = scored.filter(({ score }) => score === highest)
  return tied[Math.floor(Math.random() * tied.length)].item
}

export function CoffeeQuiz() {
  const track = useTrack()
  const content = useHomeContent().quiz
  const global = useGlobalContent()
  const quiz = useQuery(api.menuQuiz.getPublicQuiz)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<QuizItem | null>(null)

  const questions = (quiz?.questions ?? EMPTY_QUESTIONS) as QuizQuestion[]
  const items = (quiz?.items ?? EMPTY_ITEMS) as QuizItem[]
  const configurationKey = useMemo(
    () =>
      questions
        .map(
          (question) => `${question._id}:${question.options.map((option) => option._id).join(",")}`,
        )
        .join("|"),
    [questions],
  )

  useEffect(() => {
    setStep(0)
    setAnswers({})
    setResult(null)
  }, [configurationKey])

  const ready =
    quiz?.enabled === true &&
    questions.length > 0 &&
    questions.every((question) => question.options.length > 0) &&
    items.length > 0

  // The admin can keep the section off while configuring it. It also fails
  // closed if there are no complete questions or eligible Coffee items.
  if (!ready) return null

  const current = questions[step]

  function choose(optionId: string) {
    const next = { ...answers, [current._id]: optionId }
    setAnswers(next)
    if (step + 1 < questions.length) {
      setStep(step + 1)
    } else {
      setResult(recommend(items, next))
    }
  }

  function reset() {
    setStep(0)
    setAnswers({})
    setResult(null)
  }

  const orderUrl = result?.orderUrl || global.orderUrl

  return (
    <section className="relative overflow-hidden bg-espresso py-24 text-cream">
      <SectionLines count={26} opacity={0.1} drift="right" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -18% 0px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-groovy text-sm tracking-[0.35em] text-amber uppercase">
            <EditableText path="quiz.kicker" value={content.kicker} />
          </p>
          <h2 className="mt-3 font-groovy text-4xl leading-tight md:text-5xl">
            <EditableText path="quiz.title" value={content.title} />
          </h2>
          <p className="mt-5 max-w-md text-cream/70">
            <EditableText path="quiz.body" value={content.body} />
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -18% 0px" }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative min-h-[340px] rounded-3xl border border-cream/15 bg-cream/[0.04] p-8 backdrop-blur"
        >
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key={current._id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mb-6 flex items-center gap-2">
                  {questions.map((question, index) => (
                    <span
                      key={question._id}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        index <= step ? "bg-gold" : "bg-cream/20"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs tracking-[0.3em] text-amber uppercase">
                  Question {step + 1} / {questions.length}
                </p>
                <h3 className="mt-2 font-groovy text-2xl">{current.prompt}</h3>
                <div className="mt-6 space-y-3">
                  {current.options.map((option) => (
                    <motion.button
                      key={option._id}
                      type="button"
                      whileHover={{ x: 6 }}
                      onClick={() => choose(option._id)}
                      className="flex w-full items-center justify-between rounded-2xl border border-cream/15 bg-cream/5 px-5 py-3.5 text-left font-medium transition-colors hover:border-gold hover:bg-gold/10"
                    >
                      {option.label}
                      <span className="text-gold">→</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <p className="text-xs tracking-[0.3em] text-amber uppercase">Your match</p>
                <div className="mt-4 overflow-hidden rounded-2xl border border-cream/15 bg-cream text-espresso shadow-xl shadow-black/20">
                  {result.image && (
                    <img
                      src={result.image}
                      alt={result.name}
                      className="h-44 w-full object-cover"
                    />
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-groovy text-2xl leading-tight">{result.name}</h3>
                      <span className="shrink-0 font-semibold text-brick">{result.price}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-espresso/70">
                      {result.description}
                    </p>
                    <a
                      href={orderUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() =>
                        track("order_click", {
                          clickSource: "quiz",
                          menuItemName: result.name,
                          destination: orderUrl,
                        })
                      }
                      className="mt-4 block rounded-full bg-terracotta px-6 py-3 text-center font-semibold text-cream transition-colors hover:bg-brick"
                    >
                      Order {result.name} →
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 rounded-full border border-cream/30 px-6 py-2.5 text-sm font-semibold transition-colors hover:border-gold hover:text-gold"
                >
                  Try again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
