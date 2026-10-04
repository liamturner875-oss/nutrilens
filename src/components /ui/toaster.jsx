import React, { useState, useEffect } from 'react';

let toastTimeout;
let setToastGlobal = () => {};

export function toast(message) {
  setToastGlobal(message);
}

// Fixed line: Changed "export default function" to a named "export function"
export function Toaster() {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setToastGlobal = (msg) => {
      setMessage(msg);
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => setMessage(null), 3000);
    };
  }, []);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-h-screen w-full flex-col-reverse p-4 md:max-w-[420px]">
      <div className="pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border border-border bg-card p-6 pr-8 text-card-foreground shadow-lg transition-all dark:bg-zinc-900 dark:border-zinc-800">
        <p className="text-sm font-semibold">{message}</p>
      </div>
    </div>
  );
}

// Added safety default export just in case
export default Toaster;

