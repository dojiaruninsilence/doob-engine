import { MutationWriteTarget } from "../../../types/mutation/MutationWriteTargetTypes";

export interface IMutationWriter {

    save(
        targets: MutationWriteTarget[]
    ): Promise<void>;
}