import { CID } from "multiformats/cid";

// IPFS gateway for index images. Override with NEXT_PUBLIC_IPFS_GATEWAY
// (e.g. a dedicated Pinata subdomain). Dok: /websites/multiformats_github_io_js-multiformats
// — CID.parse validates; /pinatacloud/pinata — upload returns result.cid.
export const IPFS_GATEWAY =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://dweb.link";

/** Gateway URL for an on-chain imageCID, or null when missing/invalid. */
export function ipfsUrl(cid: string | null | undefined): string | null {
  if (!cid) return null;
  const clean = cid.trim();
  if (!clean || clean.includes("/") || clean.includes(" ")) return null;
  try {
    CID.parse(clean);
  } catch {
    return null;
  }
  return `${IPFS_GATEWAY}/ipfs/${clean}`;
}
