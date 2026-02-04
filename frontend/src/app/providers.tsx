"use client";

import { PropsWithChildren, useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/lib/store";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { makeQueryClient } from "@/lib/queryClient";
import ThemeProvider from "@/components/providers/ThemeProvider";

export default function Providers({ children }: PropsWithChildren) {
  const [store] = useState(() => makeStore());
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          {children}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          )}
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
