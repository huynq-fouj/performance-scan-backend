export interface AuthData {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}
