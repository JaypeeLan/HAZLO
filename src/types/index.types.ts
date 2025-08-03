export interface UserInterface {
  _id?: string;
  id?: string;
  email: string;
  profileImage: string;
  phone: string;
  password: string;
  name?: string;
  username?: string;
  address?: string;
  role: 'user' | 'admin';
  token?: string;
  isVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpires?: Date;
  notification?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
