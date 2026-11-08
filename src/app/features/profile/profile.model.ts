export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface ProfileChanges {
  name?: string;
  phone?: string;
}
