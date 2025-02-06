"use client";  // 确保 ApolloProvider 只在客户端运行

import { ApolloProvider } from "@apollo/client";
import client from "@/lib/apolloClient";

export default function ApolloClientProvider({ children }: { children: React.ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
