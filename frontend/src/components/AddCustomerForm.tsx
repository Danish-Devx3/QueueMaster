import { FormEvent, useState } from 'react';
import { PlusIcon } from './icons';

interface AddCustomerFormProps {
  onAdd: (input: { name: string; phone?: string }) => Promise<boolean>;
}

/**
 * Controlled form to add a customer. Owns its own input state and inline validation; delegates
 * the actual submission to the parent via `onAdd`, clearing the fields only on success.
 */
export function AddCustomerForm({ onAdd }: AddCustomerFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Please enter a customer name.');
      return;
    }

    setValidationError(null);
    setSubmitting(true);
    const ok = await onAdd({ name: trimmedName, phone: phone.trim() || undefined });
    setSubmitting(false);

    if (ok) {
      setName('');
      setPhone('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start"
    >
      <div className="flex-1">
        <label htmlFor="name" className="sr-only">
          Customer name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Customer name"
          maxLength={80}
          disabled={submitting}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
        />
        {validationError && <p className="mt-1 text-xs text-red-600">{validationError}</p>}
      </div>

      <div className="sm:w-44">
        <label htmlFor="phone" className="sr-only">
          Phone (optional)
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (optional)"
          maxLength={30}
          disabled={submitting}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <PlusIcon width={15} height={15} />
        {submitting ? 'Adding…' : 'Add to queue'}
      </button>
    </form>
  );
}
