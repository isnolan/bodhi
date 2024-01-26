interface ProviderWithRelations {
  id: number;
  weight: number;
  model: {
    id: number;
    name: string;
    icon: string;
    is_function: number; // Change this to number
    is_vision: number;
  };
  instance: {
    id: number;
    type: string;
    name: string;
  };
}
