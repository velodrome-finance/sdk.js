import {
  Button,
  ChevronDownIcon,
  ListGroup,
  ListGroupItem,
  Modal,
} from "flowbite-react";
import { useState } from "react";
import { type Chain } from "viem";

export function ChainPicker({
  chains,
  selectedChain,
  onChainSelected,
  className = "",
}: {
  chains: Chain[];
  selectedChain: Chain;
  onChainSelected: (chain: Chain) => void;
  className?: string;
}) {
  const [openModal, setOpenModal] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpenModal(true)}
        className={`px-2 ${className}`}
      >
        <span className="text-ellipsis whitespace-nowrap overflow-hidden">
          {selectedChain?.name}
        </span>{" "}
        <ChevronDownIcon />
      </Button>
      <Modal dismissible show={openModal} onClose={() => setOpenModal(false)}>
        <ListGroup className="overflow-auto ">
          {chains.map((chain) => (
            <ListGroupItem
              key={chain.id}
              active={selectedChain === chain}
              onClick={() => (onChainSelected?.(chain), setOpenModal(false))}
            >
              {chain.name}
            </ListGroupItem>
          ))}
        </ListGroup>
      </Modal>
    </>
  );
}
