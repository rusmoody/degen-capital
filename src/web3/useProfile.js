import { useAccount, useReadContract } from "wagmi";
import { CONTRACT_ADDRESS } from "./contract";
import { abi } from "./abi";

// Читает: подключён ли кошелёк, есть ли профиль, и сам профиль (ник/аватар/рекорды).
export function useProfile() {
  const { address, isConnected, chainId } = useAccount();

  const hasQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "hasProfile",
    args: [address],
    query: { enabled: !!address },
  });

  const hasProfile = hasQuery.data === true;

  const profileQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "getProfile",
    args: [address],
    query: { enabled: !!address && hasProfile },
  });

  const refetch = () => {
    hasQuery.refetch();
    profileQuery.refetch();
  };

  return {
    address,
    isConnected,
    chainId,
    hasProfile,
    profile: profileQuery.data, // { tokenId, nick, avatarId, gamesPlayed, bestAUM, bestWeeks, createdAt }
    loading: hasQuery.isLoading || profileQuery.isLoading,
    refetch,
  };
}
