import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UserDTO } from 'src/dtos/UserDTO';
import { EmailConfirmationService } from 'src/emailConfirmation/emailConfirmation.service';

import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailConfirmationService: EmailConfirmationService,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.usersService.findOne(username);

    if (!user) {
      return null;
    }

    if (!user.activated) {
      this.emailConfirmationService.sendVerificationLink(user.email);
      throw new UnauthorizedException(
        `Foi enviado um email para ${user.email} com as instruções para realizar a ativação da sua conta.`,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: User): Promise<UserDTO> {
    const payload = { sub: user.email };

    const rt = this.jwtService.sign(payload, {
      expiresIn: 60 * 24 * 15, // 15 days
      secret: process.env.JWT_REFRESH_SECRET,
    });

    const at = this.jwtService.sign(payload);

    await this.usersService.registerRefreshToken(user.email, rt);

    return {
      user,
      token: at,
      refreshToken: rt,
    };
  }

  async validateRefreshToken({
    email,
    refreshToken,
  }: {
    email: string;
    refreshToken: string;
  }): Promise<Omit<UserDTO, 'user'>> {
    const user = await this.usersService.findOne(email);

    if (!user) {
      return null;
    }

    const isRefreshValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!isRefreshValid) {
      throw new UnauthorizedException('Refresh Token Inválido');
    }

    try {
      const payload = await this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const newPayload = { sub: payload.sub };

      const rt = this.jwtService.sign(newPayload, {
        expiresIn: 60 * 24 * 15, // 15 days
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const at = this.jwtService.sign(newPayload);

      await this.usersService.registerRefreshToken(payload.sub, rt);

      return {
        token: at,
        refreshToken: rt,
      };
    } catch {
      throw new UnauthorizedException('Refresh Token Expirado');
    }
  }
}
