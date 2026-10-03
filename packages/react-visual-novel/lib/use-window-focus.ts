import React from "react";

export function useWindowFocus() {
  const [isFocused, setIsFocused] = React.useState(hasFocus);
  React.useEffect(() => {
    setIsFocused(hasFocus());

    function onFocus() {
      setIsFocused(true);
    }

    function onBlur() {
      setIsFocused(false);
    }

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);
  return isFocused;
}

function hasFocus() {
  return typeof document !== "undefined" && document.hasFocus();
}
