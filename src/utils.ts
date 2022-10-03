import axios from "axios";
import { SessionData } from "express-session";
import { GetAccountsDto, UserLevel } from "./types";

export const mapToArray = <K, V>(map: Map<K, V>) =>
  [...map].map(([, value]) => value);

const isMod = async (address: string): Promise<boolean> => {
  try {
    const { data } = await axios.get<GetAccountsDto>(
      `${process.env.NFTPORT_API_URL}/v0/accounts/${address}?chain=ethereum`,
      {
        headers: {
          Authorization: process.env.NFTPORT_API_KEY ?? "",
        },
      }
    );
    return !!data.nfts.find(
      ({ token_id }) => token_id === process.env.MOD_NFT_TOKEN_ID
    );
  } catch (e) {
    console.error(e);
    return false;
  }
};

export const getLevel = async (
  address: string,
  session: SessionData
): Promise<UserLevel> => {
  if (address !== session.siwe?.address) {
    return "connected";
  } else if (await isMod(address)) {
    return "moderator";
  } else {
    return "authenticated";
  }
};
