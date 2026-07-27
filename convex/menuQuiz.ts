import { v } from "convex/values"
import type { Doc } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import { requireAdmin } from "./admin"

const DEFAULT_QUESTIONS = [
  {
    prompt: "Hot or iced?",
    options: ["Hot, always", "Iced, please", "Surprise me"],
  },
  {
    prompt: "How sweet are we feeling?",
    options: ["Keep it pure", "A gentle touch", "Treat-yourself sweet"],
  },
  {
    prompt: "Milk situation?",
    options: ["Black & clean", "Creamy & smooth", "Fizzy & bright"],
  },
] as const

function cleanLabel(value: string, field: string): string {
  const clean = value.trim()
  if (!clean) throw new Error(`${field} cannot be empty.`)
  if (clean.length > 160) throw new Error(`${field} is too long.`)
  return clean
}

async function getSettingsRow(ctx: QueryCtx | MutationCtx) {
  return await ctx.db.query("siteSettings").first()
}

async function orderedQuestions(ctx: QueryCtx) {
  const questions = await ctx.db.query("menuQuizQuestions").take(50)
  questions.sort((a, b) => a.order - b.order)
  return await Promise.all(
    questions.map(async (question) => {
      const options = await ctx.db
        .query("menuQuizOptions")
        .withIndex("by_questionId", (q) => q.eq("questionId", question._id))
        .take(50)
      options.sort((a, b) => a.order - b.order)
      return {
        _id: question._id,
        prompt: question.prompt,
        order: question.order,
        options: options.map((option) => ({
          _id: option._id,
          questionId: option.questionId,
          label: option.label,
          order: option.order,
        })),
      }
    }),
  )
}

async function primaryImage(ctx: QueryCtx, item: Doc<"menuItems">): Promise<string | null> {
  const first = item.images?.[0]
  if (first?.storageId) return await ctx.storage.getUrl(first.storageId)
  if (first?.path) return first.path
  if (item.imageStorageId) return await ctx.storage.getUrl(item.imageStorageId)
  return item.image ?? null
}

/** Public: quiz configuration plus only fully assigned Coffee menu candidates. */
export const getPublicQuiz = query({
  args: {},
  handler: async (ctx) => {
    const settings = await getSettingsRow(ctx)
    const enabled = settings?.menuQuizEnabled === true
    if (!enabled) return { enabled: false, questions: [], items: [] }

    const questions = await orderedQuestions(ctx)
    if (questions.length === 0 || questions.some((question) => question.options.length === 0)) {
      return { enabled: true, questions, items: [] }
    }

    const optionQuestion = new Map<string, string>()
    for (const question of questions) {
      for (const option of question.options) optionQuestion.set(option._id, question._id)
    }

    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_menu", (q) => q.eq("menu", "coffee"))
      .take(500)

    const eligible = items.filter((item) => {
      const answers = new Map(
        (item.quizAnswers ?? []).map((answer) => [answer.questionId, answer.optionId]),
      )
      return questions.every((question) => {
        const optionId = answers.get(question._id)
        return !!optionId && optionQuestion.get(optionId) === question._id
      })
    })

    return {
      enabled: true,
      questions,
      items: await Promise.all(
        eligible.map(async (item) => ({
          _id: item._id,
          name: item.name,
          description: item.description,
          price: item.price,
          orderUrl: item.orderUrl ?? null,
          image: await primaryImage(ctx, item),
          quizAnswers: item.quizAnswers ?? [],
        })),
      ),
    }
  },
})

/** Admin: complete editable configuration and current visibility state. */
export const getAdminConfig = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const settings = await getSettingsRow(ctx)
    return {
      enabled: settings?.menuQuizEnabled === true,
      questions: await orderedQuestions(ctx),
    }
  },
})

/** Seed the agreed three-question starting point once, without assigning items. */
export const ensureDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const existing = await ctx.db.query("menuQuizQuestions").take(1)
    if (existing.length > 0) return { created: false }

    await Promise.all(
      DEFAULT_QUESTIONS.map(async (question, questionOrder) => {
        const questionId = await ctx.db.insert("menuQuizQuestions", {
          prompt: question.prompt,
          order: questionOrder,
        })
        await Promise.all(
          question.options.map((label, optionOrder) =>
            ctx.db.insert("menuQuizOptions", {
              questionId,
              label,
              order: optionOrder,
            }),
          ),
        )
      }),
    )
    return { created: true }
  },
})

export const setEnabled = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, { enabled }) => {
    await requireAdmin(ctx)
    const row = await getSettingsRow(ctx)
    if (row) await ctx.db.patch(row._id, { menuQuizEnabled: enabled })
    else await ctx.db.insert("siteSettings", { menuQuizEnabled: enabled })
  },
})

export const createQuestion = mutation({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    await requireAdmin(ctx)
    const questions = await ctx.db.query("menuQuizQuestions").take(50)
    if (questions.length >= 50) throw new Error("The quiz can contain up to 50 questions.")
    const order = questions.reduce((max, question) => Math.max(max, question.order), -1) + 1
    return await ctx.db.insert("menuQuizQuestions", {
      prompt: cleanLabel(prompt, "Question"),
      order,
    })
  },
})

export const updateQuestion = mutation({
  args: { questionId: v.id("menuQuizQuestions"), prompt: v.string() },
  handler: async (ctx, { questionId, prompt }) => {
    await requireAdmin(ctx)
    await ctx.db.patch(questionId, { prompt: cleanLabel(prompt, "Question") })
  },
})

export const deleteQuestion = mutation({
  args: { questionId: v.id("menuQuizQuestions") },
  handler: async (ctx, { questionId }) => {
    await requireAdmin(ctx)
    const options = await ctx.db
      .query("menuQuizOptions")
      .withIndex("by_questionId", (q) => q.eq("questionId", questionId))
      .take(50)
    const items = await ctx.db.query("menuItems").take(500)
    await Promise.all([
      ...options.map((option) => ctx.db.delete(option._id)),
      ...items.flatMap((item) =>
        item.quizAnswers?.some((answer) => answer.questionId === questionId)
          ? [
              ctx.db.patch(item._id, {
                quizAnswers: item.quizAnswers.filter((answer) => answer.questionId !== questionId),
              }),
            ]
          : [],
      ),
      ctx.db.delete(questionId),
    ])
  },
})

export const reorderQuestions = mutation({
  args: { questionIds: v.array(v.id("menuQuizQuestions")) },
  handler: async (ctx, { questionIds }) => {
    await requireAdmin(ctx)
    await Promise.all(questionIds.map((questionId, order) => ctx.db.patch(questionId, { order })))
  },
})

export const createOption = mutation({
  args: { questionId: v.id("menuQuizQuestions"), label: v.string() },
  handler: async (ctx, { questionId, label }) => {
    await requireAdmin(ctx)
    const question = await ctx.db.get(questionId)
    if (!question) throw new Error("Question not found.")
    const options = await ctx.db
      .query("menuQuizOptions")
      .withIndex("by_questionId", (q) => q.eq("questionId", questionId))
      .take(50)
    if (options.length >= 50) throw new Error("A question can contain up to 50 options.")
    const order = options.reduce((max, option) => Math.max(max, option.order), -1) + 1
    return await ctx.db.insert("menuQuizOptions", {
      questionId,
      label: cleanLabel(label, "Option"),
      order,
    })
  },
})

export const updateOption = mutation({
  args: { optionId: v.id("menuQuizOptions"), label: v.string() },
  handler: async (ctx, { optionId, label }) => {
    await requireAdmin(ctx)
    await ctx.db.patch(optionId, { label: cleanLabel(label, "Option") })
  },
})

export const deleteOption = mutation({
  args: { optionId: v.id("menuQuizOptions") },
  handler: async (ctx, { optionId }) => {
    await requireAdmin(ctx)
    const items = await ctx.db.query("menuItems").take(500)
    await Promise.all([
      ...items.flatMap((item) =>
        item.quizAnswers?.some((answer) => answer.optionId === optionId)
          ? [
              ctx.db.patch(item._id, {
                quizAnswers: item.quizAnswers.filter((answer) => answer.optionId !== optionId),
              }),
            ]
          : [],
      ),
      ctx.db.delete(optionId),
    ])
  },
})

export const reorderOptions = mutation({
  args: {
    questionId: v.id("menuQuizQuestions"),
    optionIds: v.array(v.id("menuQuizOptions")),
  },
  handler: async (ctx, { questionId, optionIds }) => {
    await requireAdmin(ctx)
    const options = await Promise.all(optionIds.map((optionId) => ctx.db.get(optionId)))
    if (options.some((option) => !option || option.questionId !== questionId)) {
      throw new Error("An option does not belong to this question.")
    }
    await Promise.all(optionIds.map((optionId, order) => ctx.db.patch(optionId, { order })))
  },
})
