import { createContext } from "react";

// Kept in its own module so the context object's identity never changes when
// the provider's logic is hot-reloaded — otherwise mounted components can
// briefly see a different context than the one the provider supplies.
export const MealContext = createContext(null);
