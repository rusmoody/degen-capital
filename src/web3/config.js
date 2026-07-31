import { http, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";

// ВСТАВЬ сюда свой WalletConnect Project ID (cloud.walletconnect.com).
// Это НЕ секрет — можно коммитить в публичный репо.
// Пока пусто — работают MetaMask и Coinbase Wallet; как впишешь ID,
// добавятся мобильные кошельки через WalletConnect.
export const WALLETCONNECT_PROJECT_ID = "";

const connectors = [
  injected(),
  coinbaseWallet({ appName: "DEGEN CAPITAL" }),
];
if (WALLETCONNECT_PROJECT_ID) {
  connectors.push(
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: "DEGEN CAPITAL",
        description: "Crypto VC fund simulator",
        url: "https://rusmoody.github.io/degen-capital/",
        icons: [],
      },
    })
  );
}

export const config = createConfig({
  chains: [base],
  connectors,
  transports: { [base.id]: http() },
});

export const BASE_CHAIN = base;
