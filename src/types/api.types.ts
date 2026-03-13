interface TimeStamp {
  createdAt: string;
  updatedAt: string;
}

export interface Exchange extends TimeStamp {
  id: number;
  fromNftId: number;
  toNftId: number;
  status: ExchangeStatus;
  fromUserId: string;
  toUserId: string;
  fromNft?: NFT;
  toNft?: NFT;
  fromUser?: User;
  toUser?: User;
}

export interface Listing extends TimeStamp {
  id: number;
  nftId: number;
  sellerId: string;
  price: string;
  fee: string | null;
  currency: string;
  status: ListingStatus;
  nft: NFT;
  seller: User;
  trades: Trade[];
}

export interface NFT extends TimeStamp {
  id: number;
  name: string;
  description?: string | null;
  imageUrl: string;
  uri: string;
  metadata?: object | null;
  creatorId: string;
  ownerId: string;
  collectionId: number | undefined;
  categoryId?: number | null;
  owner?: User | null;
  collection?: Collection | null;
  category?: Category | null;
  fromExchanges?: Exchange[];
  toExchanges?: Exchange[];
  listings?: Listing[];
  offers?: Offer[];
  mints?: Mint[];
  auctions?: Auction[];
  trades?: Trade[];
  bids?: Bid[];
  totalAuctions?: number;
  totalBids?: number;
  totalTrades?: number;
  totalTradeVolume?: string;
  royalty?: number;
  lastPrice?: string;
  status: NFTStatus;
}

export interface Currency extends TimeStamp {
  id: number;
  name: string;
  issuerId: string;
  decimals: number;
  listings: Listing[];
  offers: Offer[];
  bids: Bid[];
  trades: Trade[];
  mints: Mint[];
}

export interface User extends TimeStamp {
  id: string;
  username: string | null;
  admin: boolean;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  socialLinks: {
    websiteUrl: string | null;
    twitterUrl: string | null;
    telegramUrl: string | null;
    discordUrl: string | null;
    instagramUrl: string | null;
  } | null;
  nfts: NFT[];
  mintings: Mint[];
  auctions: Auction[];
  collections: Collection[];
  listings: Listing[];
  offers: Offer[];
  outTrades: Trade[];
  inTrades: Trade[];
  bids: Bid[];
  notifications: Notification[];
}

export interface Notification extends TimeStamp {
  id: number;
  userId: string;
  type: NotificationType;
  read: boolean;
  title: string;
  message: string;
  metadata: object | null;
  link: string | null;
  tradeId: number | null;
  trade?: Trade | null;
}

export enum NotificationType {
  COLLECTION_CREATED = "COLLECTION_CREATED",
  NFT_LISTED = "NFT_LISTED",
  NFT_SOLD = "NFT_SOLD",
  NFT_OFFER_ACCEPTED = "NFT_OFFER_ACCEPTED",
  NFT_OFFER_REJECTED = "NFT_OFFER_REJECTED",
  NFT_OFFER_CANCELLED = "NFT_OFFER_CANCELLED",
  NFT_OFFER_RECEIVED = "NFT_OFFER_RECEIVED",
  NFT_EXCHANGE_REQUESTED = "NFT_EXCHANGE_REQUESTED",
  NFT_EXCHANGE_COMPLETED = "NFT_EXCHANGE_COMPLETED",
  NFT_EXCHANGE_CANCELLED = "NFT_EXCHANGE_CANCELLED",
  NFT_BID_PLACED = "NFT_BID_PLACED",
  NFT_BID_WON = "NFT_BID_WON",
  NFT_BID_LOST = "NFT_BID_LOST",
  NFT_AUCTION_STARTED = "NFT_AUCTION_STARTED",
  NFT_AUCTION_FINISHED = "NFT_AUCTION_FINISHED",
  NFT_MINTED = "NFT_MINTED",
  NFT_TRANSFERRED = "NFT_TRANSFERRED",
  SYSTEM_NOTIFICATION = "SYSTEM_NOTIFICATION",
}

export interface Offer extends TimeStamp {
  id: number;
  nftId: number;
  buyerId: string;
  price: string;
  currency: string;
  status: OfferStatus;
  expiresAt: string | null;
  nft?: NFT;
  buyer?: User;
  trades?: Trade[];
}

export interface Auction extends TimeStamp {
  id: number;
  nftId: number;
  userId: string | null;
  status: AuctionStatus;
  startPrice: string;
  currentPrice: string;
  currency: string;
  currentWinnerId: string | null;
  startTime: string;
  endTime: string;
  nft?: NFT;
  user?: User | null;
  bids?: Bid[];
}

export interface Collection extends TimeStamp {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  bannerUrl: string;
  uri: string;
  royalty: number;
  volume: number;
  currentSize: number;
  maxSizeHoldingPerOneId: number;
  typeOfCollection: boolean;
  priceForDropMint: string | null;
  attributes: object | null;
  creatorId: string;
  creator: User;
  categoryId: number | null;
  category: Category | null;
  externalLink: string | null;
  // IP Rights - set by creator only (only one can be selected)
  licenseType: "NONE" | "EXCLUSIVE" | "NON_EXCLUSIVE" | "COMMERCIAL" | "PERSONAL";
  dropAssets: DropAssets[];
  nfts: NFT[];
  trades: Trade[];
  mints: Mint[];
  floorPrice: string;
  totalTrades: number;
  totalTradeVolume: string;
  periodTrades?: number;
  periodVolume?: bigint;
}

export interface Category extends TimeStamp {
  id: number;
  name: string;
  description: string;
}

export interface Mint extends TimeStamp {
  id: number;
  nftId: number;
  collectionId: number;
  price: string;
  currency: string;
  userId: string | null;
  dropId: number | null;
  fee: string | null;
  nft: NFT;
  collection: Collection;
  user: User | null;
}

export interface Bid extends TimeStamp {
  id: number;
  nftId: number;
  bidderId: string;
  price: string;
  currency: string;
  auctionId: number | null;
  nft: NFT;
  bidder: User;
  auction: Auction | null;
}

export interface Trade extends TimeStamp {
  id: number;
  type: TradeType;
  fromUserId: string;
  toUserId: string;
  price: string | null;
  currency: string | null;
  txHash: string | null;
  listingId: number | null;
  offerId: number | null;
  nftId: number | null;
  collectionId: number | null;
  fee: string | null;
  fromUser: User;
  toUser: User;
  listing: Listing | null;
  offer: Offer | null;
  nft: NFT | null;
  collection: Collection | null;
}

export interface DropAssets extends TimeStamp {
  id: number;
  uri: string;
  isMinted: boolean;
  nftId: number | null;
  collectionId: number;
  collection: Collection | null;
}

export enum TradeType {
  MINT = "MINT",
  TRANSFER = "TRANSFER",
  SALE = "SALE",
  OFFER_ACCEPTED = "OFFER_ACCEPTED",
  COLLECTION_CREATED = "COLLECTION_CREATED",
  EXCHANGE = "EXCHANGE",
  BID = "BID",
}

export enum ListingStatus {
  ACTIVE = "ACTIVE",
  SOLD = "SOLD",
  CANCELLED = "CANCELLED",
}

export enum OfferStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export enum AuctionStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum ExchangeStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum NFTStatus {
  NONE = "NONE",
  LISTED = "LISTED",
  OFFER = "OFFER",
  EXCHANGE = "EXCHANGE",
}

export interface Favourite extends TimeStamp {
  id: number;
  userId: string;
  collectionId: number | null;
  nftId: number | null;
}
