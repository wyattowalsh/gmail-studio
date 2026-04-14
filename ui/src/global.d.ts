declare global {
  interface GoogleScriptRun {
    withFailureHandler(handler: (error: unknown) => void): GoogleScriptRun;
    withSuccessHandler<T>(handler: (result: T) => void): GoogleScriptRun;
    [key: string]: unknown;
  }

  interface GooglePickerDocument {
    id?: string;
  }

  interface GooglePickerData {
    action: string;
    docs: GooglePickerDocument[];
  }

  interface GooglePicker {
    setVisible(isVisible: boolean): void;
  }

  interface GooglePickerBuilder {
    addView(view: string): GooglePickerBuilder;
    build(): GooglePicker;
    setCallback(callback: (data: GooglePickerData) => void): GooglePickerBuilder;
    setDeveloperKey(key: string): GooglePickerBuilder;
    setOAuthToken(token: string): GooglePickerBuilder;
  }

  interface GooglePickerNamespace {
    Action: {
      PICKED: string;
    };
    PickerBuilder: new () => GooglePickerBuilder;
    ViewId: {
      DOCS: string;
    };
  }

  interface Window {
    gapi?: {
      load(api: string, callback: () => void): void;
    };
    google?: {
      picker?: GooglePickerNamespace;
      script?: {
        run: GoogleScriptRun;
      };
    };
  }
}

export {};
