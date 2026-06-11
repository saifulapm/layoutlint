// Ambient declarations so the corpus components typecheck under the root
// tsconfig; at runtime these imports are stubbed by the loader plugin.
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
declare module '*.css' {}
declare module '*.svg' {
  const url: string;
  export default url;
}
