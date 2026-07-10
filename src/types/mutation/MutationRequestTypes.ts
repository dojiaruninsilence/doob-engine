import { TraversalRequest } from "../traversal";

export interface MutationRequestSet {

    target: TraversalRequest;

    where: TraversalRequest[];
}