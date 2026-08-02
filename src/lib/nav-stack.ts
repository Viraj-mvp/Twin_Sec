/**
 * TwinSec Navigation Stack Utility
 * Tracks full page & section location history so returning users return to the exact page/section accessed right before it.
 */

export function pushNavLocation(location: string) {
  if (typeof window === "undefined") return;
  try {
    const stackStr = sessionStorage.getItem("twinsec_nav_history");
    const stack: string[] = stackStr ? JSON.parse(stackStr) : [];
    if (stack[stack.length - 1] !== location) {
      stack.push(location);
      if (stack.length > 20) stack.shift();
      sessionStorage.setItem("twinsec_nav_history", JSON.stringify(stack));
    }
  } catch (e) {
    console.warn("NavStack push error:", e);
  }
}

export function popNavLocation(): string {
  if (typeof window === "undefined") return "/#briefing-hub";
  try {
    const stackStr = sessionStorage.getItem("twinsec_nav_history");
    const stack: string[] = stackStr ? JSON.parse(stackStr) : [];
    stack.pop(); // Remove current page
    const previous = stack.pop(); // Get previous page
    sessionStorage.setItem("twinsec_nav_history", JSON.stringify(stack));
    return previous || "/#briefing-hub";
  } catch (e) {
    return "/#briefing-hub";
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
  if (typeof window === "undefined") return "briefing-hub";
  try {
    const prev = popNavLocation();
    if (prev.includes("#")) {
      return prev.split("#")[1];
    }
    return sessionStorage.getItem("twinsec_last_section") || "briefing-hub";
  } catch (e) {
    return "briefing-hub";
  }
}

export function getLastSection(): string {
  if (typeof window === "undefined") return "briefing-hub";
  return sessionStorage.getItem("twinsec_last_section") || "briefing-hub";
}

/**
 * Smart Back-Navigation Execution
 * Returns the user to the exact page or section accessed right before the current view.
 */
export function handleSmartBack(e?: React.MouseEvent, fallbackPath = "/#briefing-hub") {
  if (e) e.preventDefault();
  if (typeof window !== "undefined") {
    // If browser history has a previous entry within the same domain, use native history back
    if (
      window.history.length > 1 &&
      document.referrer &&
      document.referrer.includes(window.location.host)
    ) {
      window.history.back();
      return;
    }
    // Fallback to nav location stack
    const prev = popNavLocation();
    window.location.href = prev || fallbackPath;
  }
}
