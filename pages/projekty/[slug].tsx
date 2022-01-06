import type { NextPage, GetStaticPaths, GetStaticProps } from "next";
import { Layout, Section, SectionContent } from "components/layout";
import { Heading1 } from "components/typography";
import AboutProject from "components/project/about";
import ProjectCard from "components/project/project-card";
import Contribute from "components/project/contribute";
import { Projects } from "components/sections";
import { getResizedImgUrl, prepareToSerialize } from "lib/utils";
import { PortalProject, PortalUser } from "lib/portal-types";
import * as S from "components/project/styles";
import strings from "content/strings.json";
import { ParsedUrlQuery } from "querystring";
import { dataSource } from "lib/data-source";

interface PageProps {
  project: PortalProject;
  coordinators: PortalUser[];
  allProjects: PortalProject[];
}

interface QueryParams extends ParsedUrlQuery {
  slug: string;
}

const ProjectPage: NextPage<PageProps> = (props) => {
  const { project, coordinators, allProjects } = props;
  const otherProjects = allProjects.filter((p) => p != project).slice(0, 3);
  return (
    <Layout
      crumbs={[
        {
          path: "/projekty",
          label: strings.pages.projects.navigation.projects,
        },
        { label: project.name },
      ]}
      seo={{
        title: project.name,
        description: project.tagline,
        coverUrl: project.coverImageUrl,
      }}
    >
      <Section>
        <SectionContent>
          <Heading1>{project.name}</Heading1>
          <S.Tagline>{project.tagline}</S.Tagline>
          <S.CoverImageWrapper>
            <S.CoverImage
              src={getResizedImgUrl(project.coverImageUrl, 1160)}
              loading="lazy"
            />
          </S.CoverImageWrapper>
        </SectionContent>
      </Section>
      <Section>
        <SectionContent>
          <S.AboutSectionWrapper>
            <S.DescriptionWrapper>
              <AboutProject
                finished={project.finished}
                thankYouText={project.contributeText} // Using same field when project finished
                description={project.description}
              />
            </S.DescriptionWrapper>
            <S.ProjectCardWrapper>
              <ProjectCard project={project} coordinators={coordinators} />
            </S.ProjectCardWrapper>
          </S.AboutSectionWrapper>
        </SectionContent>
      </Section>
      {!project.finished && project.contributeText && (
        <Section>
          <SectionContent>
            <S.ContributeWrapper>
              <Contribute text={project.contributeText} />
            </S.ContributeWrapper>
          </SectionContent>
        </Section>
      )}
      <Section>
        <SectionContent>
          <Projects
            title={strings.components.sections.projects.otherProjects}
            projects={otherProjects}
          />
        </SectionContent>
      </Section>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths<QueryParams> = async () => {
  const projects = await dataSource.getAllProjects();
  const paths = projects
    .filter((p) => !p.draft && !p.silent)
    .map((project) => ({
      params: { slug: project.slug },
    }));
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PageProps, QueryParams> = async (
  context
) => {
  const { slug } = context.params!;
  const allProjects = await dataSource.getAllProjects();
  const allUsers = await dataSource.getAllUsers();
  const project = allProjects.find((p) => p.slug === slug)!;
  const coordinators = project.coordinatorIds.map(
    (id) => allUsers.find((user) => user.id === id)!
  );
  return {
    props: prepareToSerialize({
      allProjects,
      coordinators,
      project,
    }),
  };
};

export default ProjectPage;
