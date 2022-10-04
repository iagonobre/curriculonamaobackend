import {
  Resume,
  ProfessionalExperiences,
  SchoolEducation,
  AditionalCourses,
  Ability,
} from '@prisma/client';

export type CreateCurriculumDTO = {
  resume: Resume;
  professionalExperiences: ProfessionalExperiences[];
  schoolEducation: SchoolEducation[];
  aditionalCourses: AditionalCourses[];
  ability: Ability[];
};

export type GenerateCurriculumDTO = {
  cvID: number;
  theme: 'basic';
};

export type ResponseGenerateCurriculumDTO = {
  uri: string;
};
