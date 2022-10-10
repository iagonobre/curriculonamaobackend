import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from 'src/database/prisma/prisma.service';
import { Resume } from '@prisma/client';

import {
  CreateCurriculumDTO,
  GenerateCurriculumDTO,
} from 'src/dtos/CurriculumDTO';

import * as path from 'path';
import * as ejs from 'ejs';
import { generatePdf } from 'html-pdf-node-ts/lib';

@Injectable()
export class CvsService {
  constructor(private prisma: PrismaService) {}

  async generateFile(
    { cvID, theme }: GenerateCurriculumDTO,
    payload: string,
  ): Promise<{ uri: string }> {
    const userAuthor = await this.prisma.user.findUnique({
      where: {
        email: payload,
      },
    });

    if (!userAuthor) {
      throw new UnauthorizedException(
        'Somente um usuário válido pode criar um currículo!',
      );
    }

    const resume = await this.prisma.resume.findUnique({
      where: {
        id: cvID,
      },
      include: {
        ability: true,
        aditionalCourses: true,
        professionalExperiences: true,
        schoolEducation: true,
        author: true,
      },
    });

    if (resume.authorId !== userAuthor.id) {
      throw new UnauthorizedException('Você não tem permissão!');
    }

    const filePath = path.join(
      __dirname,
      '..',
      '..',
      'src',
      'cvs',
      'templates',
      `${theme}.ejs`,
    );

    ejs.renderFile(filePath, { resume }, (err, html) => {
      if (err) {
        Logger.log(err);
        throw new ConflictException('Erro na leitura do arquivo!');
      }

      const base = path.join(
        __dirname,
        '..',
        '..',
        'public',
        `${resume.id}-${resume.authorId}.pdf`,
      );

      const file = { content: html };

      generatePdf(file, {
        format: 'A4',
        path: base,
        margin: {
          top: 40,
          bottom: 40,
          left: 40,
          right: 40,
        },
      });
    });

    return { uri: `/cv/${resume.id}-${resume.authorId}.pdf` };
  }

  async listCurriculum(payload: string) {
    const userAuthor = await this.prisma.user.findUnique({
      where: {
        email: payload,
      },
    });

    if (!userAuthor) {
      throw new UnauthorizedException(
        'Somente um usuário válido pode criar um currículo!',
      );
    }

    const resumes = await this.prisma.resume.findMany({
      where: {
        authorId: userAuthor.id,
      },
      include: {
        ability: true,
        aditionalCourses: true,
        professionalExperiences: true,
        schoolEducation: true,
        author: true,
      },
    });

    return resumes;
  }

  async deleteCurriculum(id: number, payload: string): Promise<Resume> {
    const userAuthor = await this.prisma.user.findUnique({
      where: {
        email: payload,
      },
    });

    if (!userAuthor) {
      throw new UnauthorizedException(
        'Somente um usuário válido pode deletar um currículo!',
      );
    }

    const idNumber = Number(id);

    const resume = await this.prisma.resume.findUnique({
      where: {
        id: idNumber,
      },
    });

    if (!resume) {
      throw new ConflictException('Currículo não encontrado!');
    }

    if (resume.authorId !== userAuthor.id) {
      throw new UnauthorizedException('Você só pode deletar seus currículos!');
    }

    const resumeDeleted = await this.prisma.resume.delete({
      where: { id: resume.id },
    });

    if (!resumeDeleted) {
      throw new ConflictException('Não foi possível deletar o currículo!');
    }

    return resumeDeleted;
  }

  async createCurriculum(
    {
      ability,
      aditionalCourses,
      professionalExperiences,
      resume,
    }: CreateCurriculumDTO,
    payload: string,
  ): Promise<Resume> {
    const userAuthor = await this.prisma.user.findUnique({
      where: {
        email: payload,
      },
    });

    if (!userAuthor) {
      throw new UnauthorizedException(
        'Somente um usuário válido pode criar um currículo!',
      );
    }

    const createdResume = await this.prisma.resume.create({
      data: {
        ...resume,
        ability: {
          createMany: {
            data: ability,
          },
        },
        professionalExperiences: {
          createMany: {
            data: professionalExperiences,
          },
        },
        aditionalCourses: {
          createMany: {
            data: aditionalCourses,
          },
        },
      },
      include: {
        ability: true,
        aditionalCourses: true,
        professionalExperiences: true,
        schoolEducation: true,
        author: true,
      },
    });

    await this.prisma.user.update({
      where: {
        email: payload,
      },
      data: {
        resumes: {
          connect: {
            id: createdResume.id,
          },
        },
      },
    });

    if (!createdResume) {
      throw new ConflictException('Não foi possível criar o currículo!');
    }

    return createdResume;
  }
}
