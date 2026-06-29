import { AddCustomerForm } from './components/AddCustomerForm';
import { ErrorBanner } from './components/ErrorBanner';
import { QueueList } from './components/QueueList';
import { useQueue } from './hooks/useQueue';

/**
 * App shell: composes the header, add-customer form, error banner and the queue list, wiring them
 * to the single `useQueue` hook that owns all state and networking.
 */
export default function App() {
  const { customers, loading, error, clearError, addCustomer, updateStatus, removeCustomer } =
    useQueue();

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4">
        <header>
          <h1 className="text-2xl font-bold text-slate-800">QueueMaster</h1>
          <p className="text-sm text-slate-500">
            Manage your customer waiting queue in real time.
          </p>
        </header>

        {error && <ErrorBanner message={error} onDismiss={clearError} />}

        <AddCustomerForm onAdd={addCustomer} />

        <QueueList
          customers={customers}
          loading={loading}
          onUpdateStatus={updateStatus}
          onRemove={removeCustomer}
        />
      </main>
    </div>
  );
}
