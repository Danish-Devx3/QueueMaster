import { AddCustomerForm } from './components/AddCustomerForm';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ErrorBanner } from './components/ErrorBanner';
import { QueueList } from './components/QueueList';
import { QueueStats } from './components/QueueStats';
import { useQueue } from './hooks/useQueue';

/**
 * App shell: composes the header (with live connection status), stats, add-customer form, error
 * banner and the queue list — all wired to the single `useQueue` hook that owns state + networking.
 */
export default function App() {
  const {
    customers,
    loading,
    error,
    connected,
    clearError,
    addCustomer,
    updateStatus,
    removeCustomer,
  } = useQueue();

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">QueueMaster</h1>
            <p className="text-sm text-slate-500">
              Manage your customer waiting queue in real time.
            </p>
          </div>
          <ConnectionStatus connected={connected} />
        </header>

        <QueueStats customers={customers} />

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
