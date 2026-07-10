import { DataRecord } from "../DataTypes";
import { QueryFilter } from "../query/QueryTypes";
import { MutationMode } from "./MutationOperationTypes";
import { MutationOperation } from "./MutationOperationTypes";

export interface MutationContext {
	record: DataRecord;
	fieldPath: string;
	currentValue: any;
}

export interface MutationRequest {

	select: string;

	where?: QueryFilter[];

	operation: MutationOperation;

	mode?: MutationMode;
}