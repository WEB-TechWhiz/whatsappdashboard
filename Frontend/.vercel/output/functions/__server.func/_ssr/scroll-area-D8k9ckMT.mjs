import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { R as Root, V as Viewport, C as Corner, S as ScrollAreaScrollbar, a as ScrollAreaThumb } from "../_libs/radix-ui__react-scroll-area.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
const ScrollArea = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Root,
  {
    ref,
    className: cn("relative overflow-hidden", className),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Viewport, { className: "h-full w-full rounded-[inherit]", children }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollBar, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Corner, {})
    ]
  }
));
ScrollArea.displayName = Root.displayName;
const ScrollBar = reactExports.forwardRef(({ className, orientation = "vertical", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  ScrollAreaScrollbar,
  {
    ref,
    orientation,
    className: cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollAreaThumb, { className: "relative flex-1 rounded-full bg-border" })
  }
));
ScrollBar.displayName = ScrollAreaScrollbar.displayName;
export {
  ScrollArea as S
};
