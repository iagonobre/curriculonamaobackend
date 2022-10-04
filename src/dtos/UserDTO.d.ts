import { User } from '@prisma/client';

export type UserDTO = {
  user: {
    id: number;
    email: string;
    name: string;
  };
  token: string;
  refreshToken: string;
};

export type ActivateUserDTO = {
  token: string;
  newEmail?: string;
};

export type ResetPasswordUserDTO = {
  token: string;
  newPassword: string;
};

export type UserUploadDTO = {
  fileName: string;
  email: string;
};

export type CreateUserDTO = {
  email: string;
  name: string;
  password: string;
};

export type DeleteUserDTO = {
  email: string;
};

export type PayloadUserDTO = {
  user: {
    email: string;
  };
};

export type ListUsersDTO = {
  total: number;
  users: User[];
};

export type EditUserDTO = {
  name?: string;
  email?: string;
};

export type PasswordUserDTO = {
  oldPassword: string;
  newPassword: string;
};
