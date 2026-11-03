/* eslint-disable */
// @ts-nocheck
// Generated route tree for admin-app only. It contains no landing routes.
import { Route as rootRouteImport } from "./routes/__root";
import { Route as IndexRouteImport } from "./routes/index";
import { Route as ApiRouteImport } from "./routes/api";
import { Route as AdmRouteImport } from "./routes/adm";
import { Route as AdmApiRouteImport } from "./routes/adm.api";

const IndexRoute = IndexRouteImport.update({ id: "/", path: "/", getParentRoute: () => rootRouteImport } as any);
const ApiRoute = ApiRouteImport.update({ id: "/api", path: "/api", getParentRoute: () => rootRouteImport } as any);
const AdmRoute = AdmRouteImport.update({ id: "/adm", path: "/adm", getParentRoute: () => rootRouteImport } as any);
const AdmApiRoute = AdmApiRouteImport.update({ id: "/adm/api", path: "/adm/api", getParentRoute: () => rootRouteImport } as any);

export interface FileRoutesByFullPath { "/": typeof IndexRoute; "/api": typeof ApiRoute; "/adm": typeof AdmRoute; "/adm/api": typeof AdmApiRoute }
export interface FileRoutesByTo { "/": typeof IndexRoute; "/api": typeof ApiRoute; "/adm": typeof AdmRoute; "/adm/api": typeof AdmApiRoute }
export interface FileRoutesById { __root__: typeof rootRouteImport; "/": typeof IndexRoute; "/api": typeof ApiRoute; "/adm": typeof AdmRoute; "/adm/api": typeof AdmApiRoute }
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath;
  fullPaths: "/" | "/api" | "/adm" | "/adm/api";
  fileRoutesByTo: FileRoutesByTo;
  to: "/" | "/api" | "/adm" | "/adm/api";
  id: "__root__" | "/" | "/api" | "/adm" | "/adm/api";
  fileRoutesById: FileRoutesById;
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute;
  ApiRoute: typeof ApiRoute;
  AdmRoute: typeof AdmRoute;
  AdmApiRoute: typeof AdmApiRoute;
}

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/": { id: "/"; path: "/"; fullPath: "/"; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport };
    "/api": { id: "/api"; path: "/api"; fullPath: "/api"; preLoaderRoute: typeof ApiRouteImport; parentRoute: typeof rootRouteImport };
    "/adm": { id: "/adm"; path: "/adm"; fullPath: "/adm"; preLoaderRoute: typeof AdmRouteImport; parentRoute: typeof rootRouteImport };
    "/adm/api": { id: "/adm/api"; path: "/adm/api"; fullPath: "/adm/api"; preLoaderRoute: typeof AdmApiRouteImport; parentRoute: typeof rootRouteImport };
  }
}

const rootRouteChildren: RootRouteChildren = { IndexRoute, ApiRoute, AdmRoute, AdmApiRoute };
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>();
