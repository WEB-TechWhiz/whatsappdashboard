import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { A as Avatar$1, a as AvatarFallback$1, b as AvatarImage$1 } from "../_libs/radix-ui__react-avatar.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
const Avatar = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Avatar$1,
  {
    ref,
    className: cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
    ...props
  }
));
Avatar.displayName = Avatar$1.displayName;
const AvatarImage = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  AvatarImage$1,
  {
    ref,
    className: cn("aspect-square h-full w-full", className),
    ...props
  }
));
AvatarImage.displayName = AvatarImage$1.displayName;
const AvatarFallback = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  AvatarFallback$1,
  {
    ref,
    className: cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    ),
    ...props
  }
));
AvatarFallback.displayName = AvatarFallback$1.displayName;
export {
  Avatar as A,
  AvatarFallback as a
};
