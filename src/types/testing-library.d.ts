// Add missing type declarations for testing-library
declare module '@testing-library/react' {
  export const screen: any;
  export const fireEvent: any;
  export const waitFor: any;
  export function render(ui: React.ReactElement, options?: any): any;
}

declare module '@testing-library/dom' {
  export const screen: any;
  export const fireEvent: any; 
  export const waitFor: any;
} 