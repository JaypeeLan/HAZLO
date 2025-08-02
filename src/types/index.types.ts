export interface UserType {
  name: string;
  username: string;
  avatar: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  address: string;
  phone: string;
  notification: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
