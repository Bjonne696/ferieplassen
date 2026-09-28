// Keep a request/result per identity. A missing session (before POST) is
// retryable on a later observation; a started POST is never automatically retried.
export function createReplaySafeActivation(run) {
  const entries = new Map();
  let disposed = false;

  function start(key, entry) {
    const startedAt = entry.version;
    const task = Promise.resolve().then(() => run(key, () => !disposed && entry.observers.size > 0));
    entry.task = task;
    task.then(
      (result) => {
        if (disposed || entry.task !== task) return;
        if (result.skipped || result.retryable) {
          entry.task = null;
          if (result.skipped && entry.version > startedAt && entry.observers.size) {
            start(key, entry); // A replayed effect can resume a skipped pre-POST attempt.
          } else if (result.retryable) {
            for (const observer of entry.observers) observer(result);
          }
          return;
        }
        entry.result = result;
        for (const observer of entry.observers) observer(result);
      },
      (error) => {
        // Unknown failures are not safe to retry: the POST may have succeeded.
        if (disposed || entry.task !== task) return;
        entry.result = { phase: 'demo_error', error: error?.message || 'Demo-aktivering feilet.' };
        for (const observer of entry.observers) observer(entry.result);
      }
    );
  }

  return {
    observe(key, onResult) {
      if (disposed) return () => {};
      let entry = entries.get(key);
      if (!entry) {
        entry = { observers: new Set(), version: 0, task: null, result: null };
        entries.set(key, entry);
      }
      entry.observers.add(onResult);
      entry.version++;
      if (entry.result) queueMicrotask(() => {
        if (!disposed && entry.observers.has(onResult)) onResult(entry.result);
      });
      else if (!entry.task) start(key, entry);
      return () => entry.observers.delete(onResult);
    },
    dispose() {
      disposed = true;
      entries.clear();
    },
  };
}