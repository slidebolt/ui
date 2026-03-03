export interface PageBuilderThemeTokens {
  colors: {
    surface: string;
    surfaceSubtle: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    status: {
      busy: string;
      error: string;
      disabled: string;
    };
  };
  radius: {
    card: number;
    control: number;
    chip: number;
  };
  spacing: {
    cardPadding: number;
    cardGap: number;
    compactGap: number;
  };
  typography: {
    labelSize: number;
    valueSize: number;
    headerSize: number;
  };
  shadow: {
    module: string;
    none: string;
  };
  slider: {
    thumbSize: number;
    railThickness: number;
    railThicknessMobile: number;
    valueLabelRadius: number;
  };
}
