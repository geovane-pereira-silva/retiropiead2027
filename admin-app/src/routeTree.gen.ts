/* eslint-disable */
// @ts-nocheck
// Generated route tree for admin-app only. It contains no landing routes.
import { Route as rootRouteImport } from "./routes/__root";
import { Route as AdmRouteImport } from "./routes/adm";
import { Route as AdmApiRouteImport } from "./routes/adm.api";

const AdmRoute = AdmRouteImport.update({ id: "/adm", path: "/adm", getParentRoute: () => rootRouteImport } as any);
const AdmApiRoute = AdmApiRouteImport.update({ id: "/adm/api", path: "/adm/api", getParentRoute: () => rootRouteImport } as any);

export interface FileRoutesByFullPath { "/adm": typeof AdmRoute; "/adm/api": typeof AdmApiRoute }
export interface FileRoutesByTo { "/adm": typeof AdmRoute; "/adm/api": typeof AdmApiRoute }
export interface FileRoutesById { __root__: typeof rootRouteImport; "/adm": typeof AdmRoute; "/adm/api": typeof AdmApiRoute }
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath;
  fullPaths: "/adm" | "/adm/api";
  fileRoutesByTo: FileRoutesByTo;
  to: "/adm" | "/adm/api";
  id: "__root__" | "/adm" | "/adm/api";
  fileRoutesById: FileRoutesById;
}
export interface RootRouteChildren { AdmRoute: typeof AdmRoute; AdmApiRoute: typeof AdmApiRoute }

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/adm": { id: "/adm"; path: "/adm"; fullPath: "/adm"; preLoaderRoute: typeof AdmRouteImport; parentRoute: typeof rootRouteImport };
    "/adm/api": { id: "/adm/api"; path: "/adm/api"; fullPath: "/adm/api"; preLoaderRoute: typeof AdmApiRouteImport; parentRoute: typeof rootRouteImport };
  }
}

const rootRouteChildren: RootRouteChildren = { AdmRoute, AdmApiRoute };
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>();