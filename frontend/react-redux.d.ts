import type { RootState } from "./app/store/store";

declare module "react-redux" {
  interface DefaultRootState extends RootState {}
}
