import React from 'react'

function hasFocus() {
  return typeof document !== 'undefined' && document.hasFocus()
}

export function useWindowFocus() {
  const [focused, setFocused] = React.useState(hasFocus)
  React.useEffect(() => {
    setFocused(hasFocus())
    function onFocus() {
      return setFocused(true)
    }
    function onBlur() {
      return setFocused(false)
    }
    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
    }
  }, [])
  return focused
}
