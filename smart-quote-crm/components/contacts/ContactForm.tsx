'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import type { Contact } from '@/types'

const schema = z.object({
  name:    z.string().min(1, 'Name is required'),
  email:   z.string().email('Invalid email').or(z.literal('')).optional(),
  phone:   z.string().optional(),
  company: z.string().optional(),
  website: z.string().url('Invalid URL').or(z.literal('')).optional(),
  notes:   z.string().optional(),
  status:  z.enum(['lead', 'prospect', 'customer', 'churned']),
})

type FormValues = z.infer<typeof schema>

interface ContactFormProps {
  defaultValues?: Partial<Contact>
  onSubmit: (values: FormValues) => Promise<void>
  loading?: boolean
}

export function ContactForm({ defaultValues, onSubmit, loading }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:    defaultValues?.name ?? '',
      email:   defaultValues?.email ?? '',
      phone:   defaultValues?.phone ?? '',
      company: defaultValues?.company ?? '',
      website: defaultValues?.website ?? '',
      notes:   defaultValues?.notes ?? '',
      status:  defaultValues?.status ?? 'lead',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Name *"
          {...register('name')}
          error={errors.name?.message}
        />
        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Phone"
          type="tel"
          {...register('phone')}
          error={errors.phone?.message}
        />
        <Input
          label="Company"
          {...register('company')}
          error={errors.company?.message}
        />
        <Input
          label="Website"
          type="url"
          {...register('website')}
          error={errors.website?.message}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <select
            {...register('status')}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="lead">Lead</option>
            <option value="prospect">Prospect</option>
            <option value="customer">Customer</option>
            <option value="churned">Churned</option>
          </select>
        </div>
      </div>

      <Textarea
        label="Notes"
        {...register('notes')}
        error={errors.notes?.message}
      />

      <div className="flex justify-end gap-3">
        <Button type="submit" loading={loading}>
          {defaultValues?.id ? 'Save changes' : 'Create contact'}
        </Button>
      </div>
    </form>
  )
}
