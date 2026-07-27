import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import { useEffect, useState, type FormEvent } from "react"
import { useDialogs } from "@/admin/dialogs"
import { btn, field, label } from "@/admin/ui"

type QuizOption = {
  _id: Id<"menuQuizOptions">
  questionId: Id<"menuQuizQuestions">
  label: string
  order: number
}

type QuizQuestion = {
  _id: Id<"menuQuizQuestions">
  prompt: string
  order: number
  options: QuizOption[]
}

export function MenuQuiz() {
  const { confirm } = useDialogs()
  const config = useQuery(api.menuQuiz.getAdminConfig)
  const ensureDefaults = useMutation(api.menuQuiz.ensureDefaults)
  const setEnabled = useMutation(api.menuQuiz.setEnabled)
  const createQuestion = useMutation(api.menuQuiz.createQuestion)
  const updateQuestion = useMutation(api.menuQuiz.updateQuestion)
  const deleteQuestion = useMutation(api.menuQuiz.deleteQuestion)
  const reorderQuestions = useMutation(api.menuQuiz.reorderQuestions)
  const createOption = useMutation(api.menuQuiz.createOption)
  const updateOption = useMutation(api.menuQuiz.updateOption)
  const deleteOption = useMutation(api.menuQuiz.deleteOption)
  const reorderOptions = useMutation(api.menuQuiz.reorderOptions)

  const [newQuestion, setNewQuestion] = useState("")
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void ensureDefaults({}).catch(() => {
      setError("Could not prepare the initial quiz questions. Please refresh and try again.")
    })
  }, [ensureDefaults])

  const questions = (config?.questions ?? []) as QuizQuestion[]

  async function moveQuestion(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= questions.length) return
    const ids = questions.map((question) => question._id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    await reorderQuestions({ questionIds: ids })
  }

  async function addQuestion(event: FormEvent) {
    event.preventDefault()
    const prompt = newQuestion.trim()
    if (!prompt) return
    setSaving("new-question")
    setError(null)
    try {
      await createQuestion({ prompt })
      setNewQuestion("")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add the question.")
    } finally {
      setSaving(null)
    }
  }

  async function removeQuestion(question: QuizQuestion) {
    const accepted = await confirm({
      title: "Delete quiz question",
      message: `Delete “${question.prompt}”? Its options and all matching answers assigned to menu items will also be removed.`,
      confirmLabel: "Delete",
    })
    if (!accepted) return
    await deleteQuestion({ questionId: question._id })
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-4xl text-espresso">Menu Quiz</h1>
        <p className="mt-1 max-w-2xl text-sm text-espresso/60">
          Build the homepage coffee recommendation quiz. Only Coffee menu items with an answer
          assigned for every question can be recommended.
        </p>
      </div>

      {config === undefined ? (
        <div className="h-32 animate-pulse rounded-2xl border-2 border-sand bg-cream" />
      ) : (
        <div className="space-y-6">
          <section className="flex items-start justify-between gap-6 rounded-2xl border-2 border-sand bg-cream p-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl text-espresso">Homepage quiz</h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase ${
                    config.enabled
                      ? "bg-[#4a7c4e]/15 text-[#4a7c4e]"
                      : "bg-espresso/10 text-espresso/55"
                  }`}
                >
                  {config.enabled ? "Live" : "Hidden"}
                </span>
              </div>
              <p className="mt-2 text-sm text-espresso/70">
                When hidden, the entire quiz section is removed from the homepage. An incomplete
                quiz also stays hidden automatically.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-label="Show homepage quiz"
              aria-checked={config.enabled}
              onClick={() => void setEnabled({ enabled: !config.enabled })}
              className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                config.enabled ? "bg-[#4a7c4e]" : "bg-espresso/25"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-cream shadow transition-transform ${
                  config.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl text-espresso">Questions</h2>
                <p className="mt-1 text-sm text-espresso/60">
                  Their order here is the order visitors answer them.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuestionEditor
                  key={question._id}
                  question={question}
                  first={index === 0}
                  last={index === questions.length - 1}
                  onMove={(direction) => void moveQuestion(index, direction)}
                  onSaveQuestion={(prompt) => updateQuestion({ questionId: question._id, prompt })}
                  onDeleteQuestion={() => void removeQuestion(question)}
                  onAddOption={(optionLabel) =>
                    createOption({ questionId: question._id, label: optionLabel })
                  }
                  onSaveOption={(optionId, optionLabel) =>
                    updateOption({ optionId, label: optionLabel })
                  }
                  onDeleteOption={async (option) => {
                    const accepted = await confirm({
                      title: "Delete quiz option",
                      message: `Delete “${option.label}”? Menu items using it will lose that answer and become ineligible until updated.`,
                      confirmLabel: "Delete",
                    })
                    if (accepted) await deleteOption({ optionId: option._id })
                  }}
                  onMoveOption={async (optionIndex, direction) => {
                    const target = optionIndex + direction
                    if (target < 0 || target >= question.options.length) return
                    const optionIds = question.options.map((option) => option._id)
                    ;[optionIds[optionIndex], optionIds[target]] = [
                      optionIds[target],
                      optionIds[optionIndex],
                    ]
                    await reorderOptions({ questionId: question._id, optionIds })
                  }}
                />
              ))}
            </div>

            <form
              onSubmit={(event) => void addQuestion(event)}
              className="mt-4 flex gap-3 rounded-2xl border-2 border-dashed border-sand bg-cream/50 p-4"
            >
              <label className="min-w-0 flex-1">
                <span className={label}>New question</span>
                <input
                  className={field}
                  value={newQuestion}
                  onChange={(event) => setNewQuestion(event.target.value)}
                  placeholder="What kind of coffee sounds good?"
                />
              </label>
              <button
                type="submit"
                className={`${btn.primary} self-end`}
                disabled={!newQuestion.trim() || saving === "new-question"}
              >
                Add Question
              </button>
            </form>
          </section>

          {error && <p className="text-sm font-semibold text-brick">{error}</p>}
        </div>
      )}
    </div>
  )
}

function QuestionEditor({
  question,
  first,
  last,
  onMove,
  onSaveQuestion,
  onDeleteQuestion,
  onAddOption,
  onSaveOption,
  onDeleteOption,
  onMoveOption,
}: {
  question: QuizQuestion
  first: boolean
  last: boolean
  onMove: (direction: -1 | 1) => void
  onSaveQuestion: (prompt: string) => Promise<unknown>
  onDeleteQuestion: () => void
  onAddOption: (label: string) => Promise<unknown>
  onSaveOption: (optionId: Id<"menuQuizOptions">, label: string) => Promise<unknown>
  onDeleteOption: (option: QuizOption) => Promise<void>
  onMoveOption: (index: number, direction: -1 | 1) => Promise<void>
}) {
  const [prompt, setPrompt] = useState(question.prompt)
  const [newOption, setNewOption] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => setPrompt(question.prompt), [question.prompt])

  async function addOption(event: FormEvent) {
    event.preventDefault()
    const optionLabel = newOption.trim()
    if (!optionLabel) return
    setBusy(true)
    try {
      await onAddOption(optionLabel)
      setNewOption("")
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="rounded-2xl border-2 border-sand bg-cream p-5">
      <div className="flex items-start gap-3">
        <label className="min-w-0 flex-1">
          <span className={label}>Question</span>
          <input
            className={field}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
        </label>
        <div className="flex shrink-0 gap-1 pt-6">
          <button
            type="button"
            className={btn.secondary}
            disabled={first}
            aria-label="Move question up"
            onClick={() => onMove(-1)}
          >
            ↑
          </button>
          <button
            type="button"
            className={btn.secondary}
            disabled={last}
            aria-label="Move question down"
            onClick={() => onMove(1)}
          >
            ↓
          </button>
        </div>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          className={btn.secondary}
          disabled={!prompt.trim() || prompt.trim() === question.prompt}
          onClick={() => void onSaveQuestion(prompt.trim())}
        >
          Save Question
        </button>
        <button type="button" className={btn.danger} onClick={onDeleteQuestion}>
          Delete
        </button>
      </div>

      <div className="mt-5 border-t-2 border-sand pt-4">
        <h3 className="font-groovy text-sm tracking-[0.18em] text-terracotta uppercase">
          Answer options
        </h3>
        <div className="mt-3 space-y-2">
          {question.options.map((option, index) => (
            <OptionEditor
              key={option._id}
              option={option}
              first={index === 0}
              last={index === question.options.length - 1}
              onSave={(optionLabel) => onSaveOption(option._id, optionLabel)}
              onDelete={() => onDeleteOption(option)}
              onMove={(direction) => onMoveOption(index, direction)}
            />
          ))}
          {question.options.length === 0 && (
            <p className="rounded-xl bg-gold/10 p-3 text-sm text-espresso/70">
              Add at least one option before this quiz can appear publicly.
            </p>
          )}
        </div>
        <form onSubmit={(event) => void addOption(event)} className="mt-3 flex gap-2">
          <input
            className={field}
            value={newOption}
            onChange={(event) => setNewOption(event.target.value)}
            placeholder="New answer option"
          />
          <button type="submit" className={btn.primary} disabled={!newOption.trim() || busy}>
            Add
          </button>
        </form>
      </div>
    </article>
  )
}

function OptionEditor({
  option,
  first,
  last,
  onSave,
  onDelete,
  onMove,
}: {
  option: QuizOption
  first: boolean
  last: boolean
  onSave: (label: string) => Promise<unknown>
  onDelete: () => Promise<void>
  onMove: (direction: -1 | 1) => Promise<void>
}) {
  const [optionLabel, setOptionLabel] = useState(option.label)

  useEffect(() => setOptionLabel(option.label), [option.label])

  return (
    <div className="flex items-center gap-2">
      <input
        className={field}
        value={optionLabel}
        onChange={(event) => setOptionLabel(event.target.value)}
      />
      <button
        type="button"
        className={btn.secondary}
        disabled={!optionLabel.trim() || optionLabel.trim() === option.label}
        onClick={() => void onSave(optionLabel.trim())}
      >
        Save
      </button>
      <button
        type="button"
        className={btn.secondary}
        disabled={first}
        aria-label="Move option up"
        onClick={() => void onMove(-1)}
      >
        ↑
      </button>
      <button
        type="button"
        className={btn.secondary}
        disabled={last}
        aria-label="Move option down"
        onClick={() => void onMove(1)}
      >
        ↓
      </button>
      <button type="button" className={btn.danger} onClick={() => void onDelete()}>
        Delete
      </button>
    </div>
  )
}
