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

import type * as React from "react";

import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/hooks";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { PopoverClose } from "@radix-ui/react-popover";
import { createContext, useContext } from "react";

interface BaseProps {
  children: React.ReactNode;
}

interface RootResponsivePopoverProps extends BaseProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ResponsivePopoverProps extends BaseProps {
  className?: string;
  asChild?: true;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  sideDistance?: number;
  alignDistance?: number;
  popoverClassName?: string;
}

const IsDesktopContext = createContext<boolean | undefined>(undefined);

const useIsDesktop = () => {
  const context = useContext(IsDesktopContext);
  if (context == undefined) {
    throw new Error("useIsDesktop must be used within a ResponsivePopover");
  }
  return context;
};

const ResponsivePopover = ({
  children,
  ...props
}: RootResponsivePopoverProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const ResponsiveComponent = isDesktop ? Popover : Drawer;

  return (
    <IsDesktopContext.Provider value={isDesktop}>
      <ResponsiveComponent {...props} {...(!isDesktop && { autoFocus: true })}>
        {children}
      </ResponsiveComponent>
    </IsDesktopContext.Provider>
  );
};

const ResponsivePopoverTrigger = ({
  className,
  children,
  ...props
}: ResponsivePopoverProps) => {
  const isDesktop = useIsDesktop();
  const ResponsiveTrigger = isDesktop ? PopoverTrigger : DrawerTrigger;

  return (
    <ResponsiveTrigger className={className} {...props}>
      {children}
    </ResponsiveTrigger>
  );
};

const ResponsivePopoverClose = ({
  className,
  children,
  ...props
}: ResponsivePopoverProps) => {
  const isDesktop = useIsDesktop();
  const ResponsiveClose = isDesktop ? PopoverClose : DrawerClose;

  return (
    <ResponsiveClose className={className} {...props}>
      {children}
    </ResponsiveClose>
  );
};

const ResponsivePopoverContent = ({
  className,
  children,
  popoverClassName,
  ...props
}: ResponsivePopoverProps) => {
  const isDesktop = useIsDesktop();
  const ResponsiveContent = isDesktop ? PopoverContent : DrawerContent;

  return (
    <ResponsiveContent
      className={cn(
        !isDesktop && "w-[min(100ch,100%)]",
        isDesktop && "w-[min(100ch,calc(100%-2rem))]",
        className,
        isDesktop && popoverClassName,
      )}
      {...props}
    >
      {children}
    </ResponsiveContent>
  );
};

const ResponsivePopoverDescription = ({
  className,
  children,
  ...props
}: ResponsivePopoverProps) => {
  const isDesktop = useIsDesktop();
  const ResponsiveDescription = isDesktop
    ? (_: unknown) => null
    : DrawerDescription;

  return (
    <ResponsiveDescription className={className} {...props}>
      {children}
    </ResponsiveDescription>
  );
};

const ResponsivePopoverHeader = ({
  className,
  children,
  ...props
}: ResponsivePopoverProps) => {
  const isDesktop = useIsDesktop();
  const ResponsiveHeader = isDesktop ? (_: unknown) => null : DrawerHeader;

  return (
    <ResponsiveHeader className={className} {...props}>
      {children}
    </ResponsiveHeader>
  );
};

const ResponsivePopoverTitle = ({
  className,
  children,
  ...props
}: ResponsivePopoverProps) => {
  const isDesktop = useIsDesktop();
  const ResponsiveTitle = isDesktop ? (_: unknown) => null : DrawerTitle;

  return (
    <ResponsiveTitle className={className} {...props}>
      {children}
    </ResponsiveTitle>
  );
};

const ResponsivePopoverBody = ({
  className,
  children,
  ...props
}: ResponsivePopoverProps) => {
  return (
    <div className={cn("px-4 md:px-0", className)} {...props}>
      {children}
    </div>
  );
};

const ResponsivePopoverFooter = ({
  className,
  children,
  ...props
}: ResponsivePopoverProps) => {
  const isDesktop = useIsDesktop();
  const ResponsiveFooter = isDesktop ? (_: unknown) => null : DrawerFooter;

  return (
    <ResponsiveFooter className={className} {...props}>
      {children}
    </ResponsiveFooter>
  );
};

export {
  ResponsivePopover,
  ResponsivePopoverTrigger,
  ResponsivePopoverClose,
  ResponsivePopoverContent,
  ResponsivePopoverDescription,
  ResponsivePopoverHeader,
  ResponsivePopoverTitle,
  ResponsivePopoverBody,
  ResponsivePopoverFooter,
};
