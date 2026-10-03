import React from "react";

export function useWindowFocus() {
  const [focused, setFocused] = React.useState(hasFocus);
  React.useEffect(() => {
    setFocused(hasFocus());

    function onFocus() {
      setFocused(true);
    }

    function onBlur() {
      setFocused(false);
    }

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);
  return focused;
}

function hasFocus() {
  return typeof document !== "undefined" && document.hasFocus();
}
