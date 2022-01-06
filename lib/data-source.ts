import { getAllVideos, PortalVideo } from "./cedu";
import {
  getAllProjects,
  getAllOpportunities,
  getAllEvents,
  getAllPartners,
  getAllUsers,
} from "./airtable-import";
import {
  PortalEvent,
  PortalOpportunity,
  PortalPartner,
  PortalProject,
  PortalUser,
} from "./portal-types";

/**
 * An abstraction over different data sources that we may have
 *
 * Data consumers should know nothing about Airtable or other data sources.
 */
export interface DataSource {
  getAllProjects: () => Promise<PortalProject[]>;
  getAllOpportunities: () => Promise<PortalOpportunity[]>;
  getAllUsers: () => Promise<PortalUser[]>;
  getAllEvents: () => Promise<PortalEvent[]>;
  getAllPartners: () => Promise<PortalPartner[]>;
  getAllVideos: () => Promise<PortalVideo[]>;
}

/** Main data source that reads data from Airtable (mostly everything) and local filesystem (videos) */
const mainDataSource: DataSource = {
  getAllProjects,
  getAllOpportunities,
  getAllUsers,
  getAllEvents,
  getAllPartners,
  getAllVideos,
};

export const dataSource = mainDataSource;
