/**
 * Ambient module declaration for html-docx-js.
 * The package ships no types; we expose the browser bundle's asBlob function.
 */
declare module "html-docx-js/dist/html-docx" {
  const htmlDocx: {
    asBlob: (html: string) => Blob;
  };
  export default htmlDocx;
  export const asBlob: (html: string) => Blob;
}
