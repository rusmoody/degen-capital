// Адрес задеплоенного контракта DegenAccount на Base mainnet (chain 8453)
export const CONTRACT_ADDRESS = "0xCCBeC786086afa44fD2d14E125c2F2cd71654ee3";

// Шлюз Pinata для картинок аватаров (CID папки с 1.png..8.png)
export const AVATAR_GATEWAY =
  "https://peach-dangerous-weasel-567.mypinata.cloud/ipfs/bafybeibo7eo7qhcrnb7tnsb6dcz2fgmcrttmwjh5xfnyeykbjqsdlza2iy/";

export const AVATAR_COUNT = 8;
export const avatarUrl = (id) => `${AVATAR_GATEWAY}${id}.png`;

// правила ника: латиница+цифры, 3..16, нижний регистр
export const NICK_RE = /^[a-z0-9]{3,16}$/;
