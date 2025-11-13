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
import * as html_to_pdf from 'html-pdf-node';

@Injectable()
export class CvsService {
  constructor(private prisma: PrismaService) {}

  async generateFile(
    { cvID, theme }: GenerateCurriculumDTO,
    payload: string,
  ): Promise<{ uri: string }> {
    const userAuthor = await this.prisma.user.findUnique({
      where: { email: payload },
    });

    if (!userAuthor)
      throw new UnauthorizedException(
        'Somente um usuário válido pode criar um currículo!',
      );

    const resume = await this.prisma.resume.findUnique({
      where: { id: cvID },
      include: {
        ability: true,
        aditionalCourses: true,
        professionalExperiences: true,
        schoolEducation: true,
        author: true,
      },
    });

    if (!resume) throw new ConflictException('Currículo não encontrado!');

    if (resume.authorId !== userAuthor.id)
      throw new UnauthorizedException('Você não tem permissão!');

    const filePath = path.join(
      __dirname,
      '..',
      '..',
      'src',
      'cvs',
      'templates',
      `${theme}.ejs`,
    );

    const outputPath = path.join(
      __dirname,
      '..',
      '..',
      'public',
      `${resume.id}-${resume.authorId}.pdf`,
    );

    try {
      const html = await ejs.renderFile(filePath, { resume });

      const file = { content: html };

      // Caminho do Chromium (necessário no Ubuntu)
      process.env.PUPPETEER_EXECUTABLE_PATH =
        process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';

      const options: html_to_pdf.CreateOptions = {
        format: 'A4',
        path: outputPath,
        margin: {
          top: '40px',
          bottom: '40px',
          left: '40px',
          right: '40px',
        },
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // <- ESSENCIAL
      };

      await html_to_pdf.generatePdf(file, options);

      return { uri: `/cv/${resume.id}-${resume.authorId}.pdf` };
    } catch (err) {
      Logger.error(err);
      throw new ConflictException('Erro ao gerar PDF!');
    }
  }

  async listCurriculum(payload: string) {
    const userAuthor = await this.prisma.user.findUnique({
      where: { email: payload },
    });

    if (!userAuthor) {
      throw new UnauthorizedException(
        'Somente um usuário válido pode listar os currículos!',
      );
    }

    return this.prisma.resume.findMany({
      where: { authorId: userAuthor.id },
      include: {
        ability: true,
        aditionalCourses: true,
        professionalExperiences: true,
        schoolEducation: true,
        author: true,
      },
    });
  }

  async deleteCurriculum(id: number, payload: string): Promise<Resume> {
    const userAuthor = await this.prisma.user.findUnique({
      where: { email: payload },
    });

    if (!userAuthor) {
      throw new UnauthorizedException(
        'Somente um usuário válido pode deletar um currículo!',
      );
    }

    const resume = await this.prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      throw new ConflictException('Currículo não encontrado!');
    }

    if (resume.authorId !== userAuthor.id) {
      throw new UnauthorizedException('Você só pode deletar seus currículos!');
    }

    const deleted = await this.prisma.resume.delete({ where: { id } });

    if (!deleted) {
      throw new ConflictException('Não foi possível deletar o currículo!');
    }

    return deleted;
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
      where: { email: payload },
    });

    if (!userAuthor) {
      throw new UnauthorizedException(
        'Somente um usuário válido pode criar um currículo!',
      );
    }

    const createdResume = await this.prisma.resume.create({
      data: {
        ...resume,
        ability: { createMany: { data: ability } },
        professionalExperiences: {
          createMany: { data: professionalExperiences },
        },
        aditionalCourses: { createMany: { data: aditionalCourses } },
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
      where: { email: payload },
      data: {
        resumes: { connect: { id: createdResume.id } },
      },
    });

    return createdResume;
  }
}
