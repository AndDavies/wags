declare namespace JSX {
    interface IntrinsicElements {
      'place-autocomplete': {
        className?: string;
        placeholder?: string;
        value?: string;
        onInput?: (event: Event) => void;
        types?: string;
      };
    }
  }