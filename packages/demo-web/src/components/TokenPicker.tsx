import {
  Button,
  ChevronDownIcon,
  ListGroup,
  ListGroupItem,
  Modal,
} from "flowbite-react";
import { useState } from "react";
import type { Token } from "sugar-sdk";
import { formatUnits } from "viem";

export function TokenPicker({
  tokens,
  selectedTokenAddress,
  onTokenSelect,
  excludeTokenAddresses = [],
}: {
  tokens: Token[];
  selectedTokenAddress: string;
  onTokenSelect: (token: Token) => void;
  excludeTokenAddresses?: string[];
}) {
  const [openModal, setOpenModal] = useState(false);

  const filteredTokens = tokens.filter(
    (token) => !excludeTokenAddresses.includes(token.address)
  );

  const selectedToken = filteredTokens.find(
    (token) => token.address === selectedTokenAddress
  );

  return (
    <>
      <Button onClick={() => setOpenModal(true)} className="px-2">
        <span className="text-ellipsis whitespace-nowrap overflow-hidden">
          {selectedToken?.symbol}
        </span>{" "}
        <ChevronDownIcon />
      </Button>
      <Modal dismissible show={openModal} onClose={() => setOpenModal(false)}>
        <ListGroup className="overflow-auto ">
          {filteredTokens.map((token) => (
            <ListGroupItem
              key={token.address}
              active={selectedTokenAddress === token.address}
              onClick={() => (onTokenSelect?.(token), setOpenModal(false))}
            >
              <span className="mr-auto">
                {token.symbol + " "}
                <span className="text-sm text-gray-500">{token.address}</span>
              </span>
              <span className="text-sm text-gray-500">
                {formatUnits(token.balance, token.decimals)}
              </span>
            </ListGroupItem>
          ))}
        </ListGroup>
      </Modal>
    </>
  );
}
