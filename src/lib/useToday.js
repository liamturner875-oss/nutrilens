import { useEffect, useState } from "react";

// Today's local date key, re-checked every 30 seconds and whenever the tab
// becomes visible again — so daily views roll over at midnight even when the
// app has stayed open since the previous day.
export default function useToday() {
  const [today, setToday] = useState(() => new Date().toDateString());

  useEffect(() => {
    const check = () => setToday(new Date().toDateString());
    const timer = setInterval(check, 30000);
    const onVisibility = () => {
      if (!document.hidden) check();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return today;
}
