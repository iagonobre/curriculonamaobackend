import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from 'src/database/prisma/prisma.service';
import { User } from '@prisma/client';

import * as path from 'path';
import * as fs from 'fs';
import Handlebars from 'handlebars';
import { ActivateUserDTO } from 'src/dtos/UserDTO';

@Injectable()
export class EmailConfirmationService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  public sendVerificationLink(email: string, newEmail?: string) {
    const payload = { sub: email };

    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_VERIFICATION_TOKEN_SECRET,
      expiresIn: 60 * 1, // 1 hour,
    });

    const url = `${
      newEmail
        ? `${process.env.EMAIL_CONFIRMATION_URL}/activate?token=${token}&newEmail=${newEmail}`
        : `${process.env.EMAIL_CONFIRMATION_URL}/activate?token=${token}`
    }`;

    const emailTemplateSource = fs.readFileSync(
      path.join(
        __dirname,
        '..',
        '..',
        'src/emailConfirmation/emails/email.handlebars',
      ),
      'utf8',
    );
    const template = Handlebars.compile(emailTemplateSource);
    const htmlToSend = template({ url });

    return this.emailService.sendMail({
      from: '<curriculonamaoifrn@gmail.com>',
      to: newEmail ? newEmail : email,
      subject: 'Currículo na Mão - Ative a sua conta',
      html: htmlToSend,
    });
  }

  public async checkTokenEmailValidation({
    token,
    newEmail,
  }: ActivateUserDTO): Promise<Omit<User, 'password'>> {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: process.env.JWT_VERIFICATION_TOKEN_SECRET,
      });

      if (typeof payload === 'object' && 'sub' in payload) {
        const email = payload.sub;

        const user = await this.prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new UnauthorizedException(
            'Parece que houve um erro ao realizar o seu cadastro, por favor tente novamente.',
          );
        }

        const updatedUser = await this.prisma.user.update({
          where: {
            email,
          },
          data: {
            activated: true,
            email: newEmail ? newEmail : user.email,
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
