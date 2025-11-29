"use client";

import '@tomo-inc/tomo-evm-kit/styles.css';
import { ConnectButton,getDefaultConfig, TomoEVMKitProvider } from "@tomo-inc/tomo-evm-kit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { aeneid } from "@story-protocol/core-sdk";

const config = getDefaultConfig({
  appName: "Beluga",
  clientId: "dGcdGcTWIhBsesDXlzLjWLaJX9rQUbdhb1F1GcmXufOdSfqs9LhHucUUYz3ynCMOigfszcrGNX4qprZKbAb558hT",
  projectId: "87d320198077b925fed90ef66bc2708f",
  chains: [aeneid],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

export default function Web3Providers({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TomoEVMKitProvider>
          {children}
        </TomoEVMKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}