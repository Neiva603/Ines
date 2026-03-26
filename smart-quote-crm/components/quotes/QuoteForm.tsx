'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useAIQuote } from '@/hooks/useAIQuote'
import { formatCurrency, generateId } from '@/lib/utils'
import { SUPPORTED_CURRENCIES } from '@/lib/constants'
import type { Quote, Contact } from '@/types'

const lineItemSchema = z.object({
  id:          z.string(),
  description: z.string().min(1, 'Required'),
  quantity:    z.coerce.number().positive('Must be > 0'),
  unit_price:  z.coerce.number().min(0, 'Must be ≥ 0'),
  total:       z.number(),
})

const schema = z.object({
  title:       z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  currency:    z.enum(['EUR', 'USD', 'GBP']),
  valid_until: z.string().optional(),
  notes:       z.string().optional(),
  line_items:  z.array(lineItemSchema).min(1, 'Add at least one item'),
})

type FormValues = z.infer<typeof schema>

interface QuoteFormProps {
  contact: Contact
  defaultValues?: Partial<Quote>
  onSubmit: (values: FormValues & { total_amount: number }) => Promise<void>
  loading?: boolean
}

export function QuoteForm({ contact, defaultValues, onSubmit, loading }: QuoteFormProps) {
  const [aiPrompt, setAiPrompt] = useState('')
  const { generate, loading: aiLoading, error: aiError } = useAIQuote()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:       defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      currency:    (defaultValues?.currency as 'EUR' | 'USD' | 'GBP') ?? 'EUR',
      valid_until: defaultValues?.valid_until?.split('T')[0] ?? '',
      notes:       defaultValues?.notes ?? '',
      line_items:  (defaultValues?.line_items as FormValues['line_items']) ?? [
        { id: generateId(), description: '', quantity: 1, unit_price: 0, total: 0 },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'line_items' })
  const watchedItems = watch('line_items')
  const currency = watch('currency')

  const totalAmount = watchedItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0,
  )

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return
    const result = await generate({
      contactId: contact.id,
      prompt: aiPrompt,
      context: { contactName: contact.name, company: contact.company ?? undefined },
    })
    if (result) {
      setValue('title', result.title)
      setValue('description', result.description)
      setValue('notes', result.notes)
      setValue(
        'line_items',
        result.lineItems.map((item) => ({
          ...item,
          total: item.quantity * item.unit_price,
        })),
      )
    }
  }

  const handleFormSubmit = async (values: FormValues) => {
    await onSubmit({ ...values, total_amount: totalAmount })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* AI Generation */}
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
        <p className="mb-2 text-sm font-medium text-purple-800">
          Generate with AI (optional)
        </p>
        <div className="flex gap-2">
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder={`Describe the quote for ${contact.name}…`}
            className="flex-1 rounded-lg border border-purple-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Button
            type="button"
            variant="secondary"
            loading={aiLoading}
            onClick={handleGenerateWithAI}
          >
            Generate
          </Button>
        </div>
        {aiError && <p className="mt-1 text-xs text-red-600">{aiError}</p>}
      </div>

      {/* Quote details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Title *"
          {...register('title')}
          error={errors.title?.message}
          className="sm:col-span-2"
        />
        <Textarea
          label="Description"
          {...register('description')}
          error={errors.description?.message}
          className="sm:col-span-2"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Currency</label>
          <select
            {...register('currency')}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <Input
          label="Valid until"
          type="date"
          {...register('valid_until')}
          error={errors.valid_until?.message}
        />
      </div>

      {/* Line items */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Line items</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              append({ id: generateId(), description: '', quantity: 1, unit_price: 0, total: 0 })
            }
          >
            + Add item
          </Button>
        </div>
        {errors.line_items?.root && (
          <p className="mb-2 text-xs text-red-600">{errors.line_items.root.message}</p>
        )}
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-12 gap-2 rounded-lg border border-gray-200 p-3"
            >
              <div className="col-span-12 sm:col-span-5">
                <input
                  {...register(`line_items.${index}.description`)}
                  placeholder="Item description"
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <input
                  {...register(`line_items.${index}.quantity`)}
                  type="number"
                  min="1"
                  placeholder="Qty"
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div className="col-span-4 sm:col-span-3">
                <input
                  {...register(`line_items.${index}.unit_price`)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Unit price"
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div className="col-span-3 sm:col-span-1 flex items-center justify-end text-sm font-medium text-gray-700">
                {formatCurrency(
                  (Number(watchedItems[index]?.quantity) || 0) *
                    (Number(watchedItems[index]?.unit_price) || 0),
                  currency,
                )}
              </div>
              <div className="col-span-1 flex items-center justify-end">
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-gray-400 hover:text-red-500"
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-end">
          <div className="text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalAmount, currency)}
            </p>
          </div>
        </div>
      </div>

      <Textarea label="Notes / Terms" {...register('notes')} />

      <div className="flex justify-end gap-3">
        <Button type="submit" loading={loading}>
          {defaultValues?.id ? 'Save changes' : 'Create quote'}
        </Button>
      </div>
    </form>
  )
}
