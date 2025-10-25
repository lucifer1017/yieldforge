"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TokenSymbol, getTokenConfig, getAllTokens } from "@/lib/tokens";
import { useState } from "react";

interface TokenSelectorProps {
  value: TokenSymbol;
  onValueChange: (value: TokenSymbol) => void;
  className?: string;
}

export function TokenSelector({ value, onValueChange, className }: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const tokens = getAllTokens();
  const selectedToken = getTokenConfig(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
              {selectedToken.symbol.charAt(0)}
            </div>
            <span>{selectedToken.symbol}</span>
          </div>
          <span className="text-xs text-muted-foreground ml-2">
            {selectedToken.name}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandGroup>
            {tokens.map((token) => (
              <CommandItem
                key={token.symbol}
                value={token.symbol}
                onSelect={() => {
                  onValueChange(token.symbol as TokenSymbol);
                  setOpen(false);
                }}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                    {token.symbol.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-xs text-muted-foreground">
                      {token.description}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === token.symbol ? "opacity-100" : "opacity-0"
                    )}
                  />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}




