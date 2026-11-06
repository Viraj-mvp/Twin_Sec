/**
 * TwinSec Navigation Stack Utility
 * Tracks full page & section location history so returning users return to the exact page/section accessed right before it.
 */

export function pushNavLocation(location: string) {
  if (typeof window === "undefined" || !location) return;
  try {
    const stackStr = sessionStorage.getItem("twinsec_nav_history");
    const stack: string[] = stackStr ? JSON.parse(stackStr) : [];
    if (stack[stack.length - 1] !== location) {
      stack.push(location);
      if (stack.length > 30) stack.shift();
      sessionStorage.setItem("twinsec_nav_history", JSON.stringify(stack));
    }
  } catch (e) {
    console.warn("NavStack push error:", e);
  }
}

export function popNavLocation(): string {
  if (typeof window === "undefined") return "";
  try {
    const stackStr = sessionStorage.getItem("twinsec_nav_history");
    const stack: string[] = stackStr ? JSON.parse(stackStr) : [];
    const currentPath = window.location.pathname;

    // Pop current route(s) if at top of stack
    while (stack.length > 0 && stack[stack.length - 1] === currentPath) {
      stack.pop();
    }

    const previous = stack.pop(); // Retrieve actual prior route
    sessionStorage.setItem("twinsec_nav_history", JSON.stringify(stack));
    return previous || "";
  } catch (e) {
    return "";
  }
}

export function pushNavSection(sectionId: string) {
  if (typeof window === "undefined") return;
  try {
    pushNavLocation(`/#${sectionId}`);
    sessionStorage.setItem("twinsec_last_section", sectionId);
  } catch (e) {
    console.warn("NavSection push error:", e);
  }
}

export function popNavSection(): string {
  if (typeof window === "undefined") return "";
  try {
    const prev = popNavLocation();
    if (prev.includes("#")) {
      return prev.split("#")[1];
    }
    return sessionStorage.getItem("twinsec_last_section") || "";
  } catch (e) {
    return "";
  }
}

export function getLastSection(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("twinsec_last_section") || "";
}

/**
 * Smart Back-Navigation Execution
 * Returns the user to the exact page or section accessed right before the current view.
 */
export function handleSmartBack(e?: React.MouseEvent, fallbackPath = "/briefings") {
  if (e) e.preventDefault();
  if (typeof window !== "undefined") {
    // 1. Pop from verified in-app session navigation stack
    const prev = popNavLocation();
    if (prev && prev !== window.location.pathname) {
      window.location.href = prev;
      return;
    }

    // 2. If browser has internal history entries, navigate back
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    // 3. Fallback to appropriate parent route
    window.location.href = fallbackPath;
  }
}

export function handleSmartForward(e?: React.MouseEvent) {
  if (e) e.preventDefault();
  if (typeof window !== "undefined") {
    window.history.forward();
  }
}
