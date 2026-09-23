// Side-effect and raw CSS imports from the workspace packages.
declare module "@wonder-wagon/tokens/css";
declare module "@wonder-wagon/ui/styles.css";
declare module "@wonder-wagon/themes/*.css?raw" {
  const content: string;
  export default content;
}
