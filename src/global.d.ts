import { Address } from "viem";

declare global {
  interface String {
    toLowerCase(this: Address): Address;
  }
}
