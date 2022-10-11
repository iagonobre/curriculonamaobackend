import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from 'src/database/prisma/prisma.service';
import { User } from '@prisma/client';

import * as path from 'path';
import * as fs from 'fs';

import * as bcrypt from 'bcrypt';

import Handlebars from 'handlebars';
import { ResetPasswordUserDTO } from 'src/dtos/UserDTO';

@Injectable()
export class EmailPasswordResetService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  public sendResetPasswordLink(email: string) {
    const payload = { sub: email };

    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_RESET_PASSWORD_TOKEN_SECRET,
      expiresIn: 60 * 60, // 1 hour,
    });

    const url = `${process.env.EMAIL_CONFIRMATION_URL}/recovery/activate?token=${token}`;

    const emailTemplateSource = fs.readFileSync(
      path.join(
        __dirname,
        '..',
        '..',
        'src/emailPasswordReset/emails/email.handlebars',
      ),
      'utf8',
    );

    const template = Handlebars.compile(emailTemplateSource);
    const htmlToSend = template({ url });

    return this.emailService.sendMail({
      from: '<curriculonamaoifrn@gmail.com>',
      to: email,
      subject: 'Currículo na Mão - Mudança de senha',
      html: htmlToSend,
    });
  }

  public async checkTokenResetPasswordValidation({
    token,
    newPassword,
  }: ResetPasswordUserDTO): Promise<Omit<User, 'password'>> {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: process.env.JWT_RESET_PASSWORD_TOKEN_SECRET,
      });

      if (typeof payload === 'object' && 'sub' in payload) {
        const email = payload.sub;

        const user = await this.prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.activated) {
          throw new UnauthorizedException(
            'Parece que houve um erro ao realizar o seu cadastro, por favor tente novamente.',
          );
        }

        const cryptedPassword = await bcrypt.hash(newPassword, 10);

        const updatedUser = await this.prisma.user.update({
          where: {
            email,
          },
          data: {
            password: cryptedPassword,
          },
        });

        const { password, ...result } = updatedUser;

        return result;
      }
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException(
          'O link enviado ao seu e-mail expirou, envie outro link para ativar a sua conta.',
        );
      }
      throw new BadRequestException('Algum erro inesperado ocorreu');
    }
  }
}
