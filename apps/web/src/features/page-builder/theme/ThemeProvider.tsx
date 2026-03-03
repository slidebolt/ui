import { createContext, useContext, type ReactNode } from 'react';
import { defaultPageBuilderTheme, type PageBuilderTheme } from './themes/defaultTheme';

const PageBuilderThemeContext = createContext<PageBuilderTheme>(defaultPageBuilderTheme);

interface PageBuilderThemeProviderProps {
  theme?: PageBuilderTheme;
  children: ReactNode;
}

export function PageBuilderThemeProvider({ theme, children }: PageBuilderThemeProviderProps) {
  return (
    <PageBuilderThemeContext.Provider value={theme || defaultPageBuilderTheme}>
      {children}
    </PageBuilderThemeContext.Provider>
  );
}

export function usePageBuilderTheme() {
  return useContext(PageBuilderThemeContext);
}
