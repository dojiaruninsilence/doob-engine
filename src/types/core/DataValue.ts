import { DataRecord } from "../DataTypes";
import { ResolvedReference } from "./ResolvedReference";

export type DataValue =
	| string
	| number
	| boolean
	| null
	| DataRecord
	| ResolvedReference
	| DataValue[];