// The shelter simulator shows while developing, and on a deployed site
// only when the VITE_DEMO_TOOLS environment variable is "true".
export const demoToolsEnabled =
  import.meta.env.DEV || import.meta.env.VITE_DEMO_TOOLS === "true";
