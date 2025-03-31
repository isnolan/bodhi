export interface ProviderWithRelations {
  id: number;
  weight: number;
  model: {
    id: number;
    name: string;
    icon: string;
  };
  instance: {
    id: number;
    type: string;
    name: string;
  };
  credential: {
    type: string;
    label: string;
    authorisation: any;
  };
}
