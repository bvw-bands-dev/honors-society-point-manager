/*
 * Blue Flame's Honors Society Point Manager
 * Copyright (C) 2026 Blue Flame
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/lib/hooks";

export function Combobox({
  placeholders,
  emptyRender,
  groups,
  className,
  onSelect,
  onInputChange,
  defaultValue,
  value,
  setValue,
  afterRender,
  disabled,
  allowCustomOption = false,
  customOptionLabel,
  optionLabel,
  restrictCustomOption,
}: {
  placeholders?: {
    emptyValue?: string;
    search?: string;
  };
  emptyRender?: React.ReactNode;
  className?: string;
  onSelect?: (value: string) => void;
  onInputChange?: (value: string) => void;
  defaultValue?: string;
  value?: string;
  setValue?: (value: string) => void;
  afterRender?: React.ReactNode;
  groups: {
    id: string;
    header: React.ReactNode;
    values: {
      id: string;
      render: React.ReactNode;
      selectionRender?: React.ReactNode;
    }[];
  }[];
  disabled?: boolean;
  allowCustomOption?: boolean;
  customOptionLabel?: (input: string) => React.ReactNode;
  optionLabel?: (input: string) => React.ReactNode;
  restrictCustomOption?: (input: string) => boolean;
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [open, setOpen] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(
    defaultValue ?? value ?? undefined,
  );
  const [inputValue, setInputValue] = React.useState("");

  // Prevent infinite update loop by separating effects for value and setValue
  React.useEffect(() => {
    if (value != undefined && value != localValue) {
      setLocalValue(value);
    }
    // Only update localValue from value, not the other way around here
    // to avoid infinite loop
    // setValue should be called only on user action, not in effect
    // so we remove setValue from this effect
    // eslint-disable-next-line
  }, [value]); // Only depend on value

  // Flatten all option ids for quick lookup
  const allOptionIds = React.useMemo(
    () => groups.flatMap((group) => group.values.map((v) => v.id)),
    [groups],
  );

  // Determine if we should show a custom option
  const showCustomOption =
    allowCustomOption &&
    inputValue.trim().length > 0 &&
    !allOptionIds.includes(inputValue.trim()) &&
    !restrictCustomOption?.(inputValue.trim());

  // Render label for custom option
  const customOptionRender = customOptionLabel ? (
    customOptionLabel(inputValue.trim())
  ) : (
    <>
      Add {'"'}
      <span className="font-semibold">{inputValue.trim()}</span>
      {'"'}
    </>
  );

  // Render label for selected custom option
  // (not used, so removed to avoid unused variable warning)
  // const selectedCustomOptionRender = optionLabel
  //   ? optionLabel(localValue ?? "")
  //   : localValue;

  // Helper to handle selection and propagate value up if needed
  const handleSelect = (selected: string) => {
    setLocalValue(selected);
    if (setValue && selected != value) {
      setValue(selected);
    }
    if (onSelect) {
      onSelect(selected);
    }
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "bg-input/30 w-20 justify-between overflow-hidden",
              className,
            )}
            disabled={disabled}
          >
            {localValue
              ? // Try to find a matching option in groups
                (groups
                  .flatMap((group) => group.values)
                  .find((v) => v.id == localValue)?.selectionRender ??
                groups
                  .flatMap((group) => group.values)
                  .find((v) => v.id == localValue)?.render ??
                // If not found, check if it's a custom option and render optionLabel if provided
                (!allOptionIds.includes(localValue)
                  ? optionLabel
                    ? optionLabel(localValue)
                    : localValue
                  : (placeholders?.emptyValue ?? "Select...")))
              : (placeholders?.emptyValue ?? "Select...")}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle className="sr-only">Command Menu</DrawerTitle>
          <Command>
            <CommandInput
              placeholder={placeholders?.search ?? "Search..."}
              value={inputValue}
              onInput={(evt) => {
                setInputValue(evt.currentTarget.value);
                onInputChange?.(evt.currentTarget.value);
              }}
            />
            <CommandList>
              <CommandEmpty>
                {emptyRender ?? <>No results found.</>}
              </CommandEmpty>
              {showCustomOption && (
                <CommandItem
                  key={"__custom_option__"}
                  onSelect={() => {
                    handleSelect(inputValue.trim());
                    setOpen(false);
                  }}
                  className={cn(
                    "m-4 mx-2 flex w-full justify-between px-4 py-2",
                    inputValue.trim() == localValue &&
                      "text-primary-background bg-primary/50",
                  )}
                >
                  <span>{customOptionRender}</span>
                  {inputValue.trim() == localValue && (
                    <Check className="h-4 w-4" />
                  )}
                </CommandItem>
              )}
              {groups.map((group) => (
                <CommandGroup key={group.id} heading={group.header}>
                  {group.values.map((option) => (
                    <CommandItem
                      key={option.id}
                      onSelect={() => {
                        handleSelect(option.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full justify-between px-4 py-2",
                        option.id == localValue &&
                          "text-primary-background bg-primary/50",
                      )}
                    >
                      {option.render}
                      {option.id == localValue && <Check className="h-4 w-4" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
              {afterRender}
            </CommandList>
          </Command>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "bg-input/30 w-20 justify-between overflow-hidden",
            className,
          )}
          disabled={disabled}
        >
          {localValue
            ? // Try to find a matching option in groups
              (groups
                .flatMap((group) => group.values)
                .find((v) => v.id == localValue)?.selectionRender ??
              groups
                .flatMap((group) => group.values)
                .find((v) => v.id == localValue)?.render ??
              // If not found, check if it's a custom option and render optionLabel if provided
              (!allOptionIds.includes(localValue)
                ? optionLabel
                  ? optionLabel(localValue)
                  : localValue
                : undefined))
            : (placeholders?.emptyValue ?? "Select...")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(var(--radix-popover-content-available-width),var(--radix-popover-trigger-width))] p-0">
        <Command>
          <CommandInput
            placeholder={placeholders?.search ?? "Search..."}
            value={inputValue}
            onInput={(evt) => {
              setInputValue(evt.currentTarget.value);
              onInputChange?.(evt.currentTarget.value);
            }}
          />
          <CommandList>
            <CommandEmpty>{emptyRender ?? <>No results found.</>}</CommandEmpty>
            {showCustomOption && (
              <CommandGroup heading="Custom">
                <CommandItem
                  key={"__custom_option__"}
                  onSelect={() => {
                    handleSelect(inputValue.trim());
                    setOpen(false);
                  }}
                  className={cn(
                    "mx-1 mb-1 flex w-[calc(100%-theme(spacing.2))] justify-between px-4 py-2 transition-colors",
                    inputValue.trim() == localValue &&
                      "text-primary-background bg-primary/50",
                  )}
                  value={inputValue.trim()}
                >
                  <span>{customOptionRender}</span>
                  {inputValue.trim() == localValue && (
                    <Check className="size-4" />
                  )}
                </CommandItem>
              </CommandGroup>
            )}
            {groups.map((group) => (
              <CommandGroup key={group.id} heading={group.header}>
                {group.values.map((option) => (
                  <CommandItem
                    key={option.id}
                    onSelect={() => {
                      handleSelect(option.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full justify-between px-4 py-2 transition-colors",
                      option.id == localValue &&
                        "text-primary-background bg-primary/50",
                    )}
                  >
                    {option.render}
                    {option.id == localValue && <Check className="size-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            {afterRender}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
