"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";

import { cn } from "./utils";

const ToggleGroupContext = React.createContext({
  size: "default",
  variant: "default",
});

function ToggleGroup({ className, variant = "default", size = "default", children, ...props }) {
  return (
    <ToggleGroupPrimitive.Root
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs",
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

function ToggleGroupItem({ className, children, variant, size, ...props }) {
  const context = React.useContext(ToggleGroupContext);
  const v = variant || context.variant || "default";
  const s = size || context.size || "default";

  return (
    <ToggleGroupPrimitive.Item
      data-variant={v}
      data-size={s}
      className={cn(
        "min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l",
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem };
