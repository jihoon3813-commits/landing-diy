import type { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

// @ts-ignore
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
