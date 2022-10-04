import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { User } from '@prisma/client';

import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import { join } from 'path';

import { PrismaService } from 'src/database/prisma/prisma.service';
import {
  CreateUserDTO,
  ListUsersDTO,
  EditUserDTO,
  UserUploadDTO,
  PasswordUserDTO,
} from 'src/dtos/UserDTO';
import { EmailConfirmationService } from 'src/emailConfirmation/emailConfirmation.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private emailConfirmationService: EmailConfirmationService,
  ) {}

  async uploadPhoto({
    fileName,
    email,
  }: UserUploadDTO): Promise<Omit<User, 'password'>> {
    const userAuthor = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!userAuthor) {
      throw new UnauthorizedException(
        'Somente um usuário válido pode enviar uma foto!',
      );
    }

    const oldImage = userAuthor.photoURL;

    const path = join(__dirname, '..', '..', 'public', 'images', `${oldImage}`);
    if (oldImage) {
      fs.unlinkSync(path);
    }

    const userUpdated = await this.prisma.user.update({
      where: {
        email: email,
      },
      data: {
        photoURL: fileName,
      },
    });

    if (!userUpdated) {
      throw new BadRequestException(
        'Não foi possível atualizar a foto de perfil',
      );
    }

    const { password, ...updatedUser } = userUpdated;

    return updatedUser;
  }

  async editPassword(
    { oldPassword, newPassword }: PasswordUserDTO,
    payload: string,
  ): Promise<Omit<User, 'password'>> {
    const userAuthor = await this.prisma.user.findUnique({
      where: {
        email: payload,
      },
    });

    if (!userAuthor) {
      throw new UnauthorizedException(
        'Somente um usuário válido pode editar sua senha!',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      userAuthor.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'A senha atual está incorreta. Por favor, entre com a senha atual correta!',
      );
    }

    const cryptedPassword = await bcrypt.hash(newPassword, 10);

    const userUpdated = await this.prisma.user.update({
      where: {
        id: userAuthor.id,
      },
      data: {
        password: cryptedPassword,
      },
    });

    const { password, ...updatedUser } = userUpdated;

    return updatedUser;
  }

  async editUser(
    { name, email }: EditUserDTO,
    payload: string,
  ): Promise<Omit<User, 'password'>> {
    const userAuthor = await this.prisma.user.findUnique({
      where: {
        email: payload,
      },
    });

    if (!userAuthor) {
      throw new UnauthorizedException(
        'Somente um usuário válido pode editar outro!',
      );
    }

    if (name === userAuthor.name && email === userAuthor.email) {
      const { password, ...result } = userAuthor;

      return result;
    }

    if (email !== userAuthor.email) {
      this.emailConfirmationService.sendVerificationLink(email, email);

      if (name !== userAuthor.name) {
        await this.prisma.user.update({
          where: {
            id: userAuthor.id,
          },
          data: {
            name: name ? name : userAuthor.name,
          },
        });
      }

      throw new UnauthorizedException(
        `Foi enviado um email para ${email} com as instruções para realizar a ativação do novo e-mail.`,
      );
    }

    const user = await this.prisma.user.update({
      where: {
        id: userAuthor.id,
      },
      data: {
        name: name ? name : userAuthor.name,
      },
    });

    const { password, ...result } = user;

    return result;
  }

  async findAllAndCount(): Promise<ListUsersDTO> {
    const total = await this.prisma.user.count();
    const users = await this.prisma.user.findMany();

    return {
      total,
      users,
    };
  }

  async findOne(username: string): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: username,
      },
    });

    return user;
  }

  async findOneRequest(
    username: string,
  ): Promise<Omit<User, 'password'> | undefined> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: username,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;

    return result;
  }

  async deleteUser(
    email: string,
    payload: string,
  ): Promise<Omit<User, 'password'> | undefined> {
    const userAuthor = await this.prisma.user.findUnique({
      where: {
        email: payload,
      },
    });

    if (!userAuthor) {
      throw new UnauthorizedException(
        'Somente um usuário válido pode deletar outro!',
      );
    }

    if (email === payload || userAuthor.admin) {
      const user = await this.prisma.user.delete({
        where: {
          email,
        },
      });

      const { password, ...result } = user;

      return result;
    }

    throw new UnauthorizedException(
      'Você não tem permissão para deletar outra conta!',
    );
  }

  async registerRefreshToken(
    email: string,
    refreshToken: string,
  ): Promise<Omit<User, 'password'>> {
    const cryptedRefreshToken = await bcrypt.hash(refreshToken, 10);

    const user = await this.prisma.user.update({
      where: { email },
      data: {
        refreshToken: cryptedRefreshToken,
      },
    });

    const { password, ...result } = user;

    return result;
  }

  async createUser({
    email,
    name,
    password,
  }: CreateUserDTO): Promise<Omit<User, 'password'> | undefined> {
    const checkIfUserExists = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (checkIfUserExists) {
      throw new BadRequestException(
        'Você já possuí uma conta com este e-mail.',
      );
    }

    const cryptedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: cryptedPassword,
        createdAt: new Date(),
        activated: false,
        admin: process.env.FIRST_ADMIN === email,
      },
    });

    try {
      this.emailConfirmationService.sendVerificationLink(email);
    } catch (err) {
      Logger.log(err);
      throw new BadRequestException(
        'Não conseguimos enviar o e-mail de confirmação, certifique que o e-mail existe.',
      );
    }

    const { password: userPassword, ...result } = user;

    return result;
  }
}
