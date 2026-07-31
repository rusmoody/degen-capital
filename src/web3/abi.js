// ABI контракта DegenAccount — только функции, которые вызывает фронт.
export const abi = [
  { type: "function", name: "hasProfile", stateMutability: "view",
    inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "bool" }] },

  { type: "function", name: "nickAvailable", stateMutability: "view",
    inputs: [{ name: "nick", type: "string" }], outputs: [{ name: "", type: "bool" }] },

  { type: "function", name: "mintFee", stateMutability: "view",
    inputs: [], outputs: [{ name: "", type: "uint256" }] },

  { type: "function", name: "tokenURI", stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "string" }] },

  { type: "function", name: "getProfile", stateMutability: "view",
    inputs: [{ name: "player", type: "address" }],
    outputs: [{ type: "tuple", components: [
      { name: "tokenId", type: "uint256" },
      { name: "nick", type: "string" },
      { name: "avatarId", type: "uint8" },
      { name: "gamesPlayed", type: "uint32" },
      { name: "bestAUM", type: "uint256" },
      { name: "bestWeeks", type: "uint32" },
      { name: "createdAt", type: "uint64" },
    ] }] },

  { type: "function", name: "getSave", stateMutability: "view",
    inputs: [{ name: "player", type: "address" }],
    outputs: [{ type: "tuple", components: [
      { name: "cid", type: "string" },
      { name: "gameYear", type: "uint16" },
      { name: "updatedAt", type: "uint64" },
      { name: "exists", type: "bool" },
    ] }] },

  { type: "function", name: "mintProfile", stateMutability: "payable",
    inputs: [{ name: "nick", type: "string" }, { name: "avatarId", type: "uint8" }], outputs: [] },

  { type: "function", name: "saveGame", stateMutability: "nonpayable",
    inputs: [{ name: "cid", type: "string" }, { name: "gameYear", type: "uint16" }], outputs: [] },

  { type: "function", name: "resetGame", stateMutability: "nonpayable",
    inputs: [], outputs: [] },

  { type: "function", name: "submitResult", stateMutability: "nonpayable",
    inputs: [{ name: "finalAUM", type: "uint256" }, { name: "weeksSurvived", type: "uint32" }], outputs: [] },
];
