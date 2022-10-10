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
import * as pdf from 'html-pdf';

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

      pdf
        .create(html, {
          height: '11.25in',
          width: '8.5in',
          header: {
            height: '20mm',
          },
          border: {
            left: '10mm',
            right: '10mm',
          },
          phantomPath: './node-modules/phantomjs-prebuil/bin/phantomjs',
          footer: {
            height: '20mm',
          },
        })
        .toFile(base, (err) => {
          if (err) {
            throw new ConflictException('Erro ao gerar arquivo!');
          }
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
